import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

/**
 * Fixed-window rate limiting backed by Postgres.
 *
 * One atomic upsert per check: the row for `key` is created, incremented, or
 * reset when its window has passed, all in a single statement, so concurrent
 * requests cannot race past the limit. Memory-based limiters look like they
 * work locally and do nothing on serverless hosts, where every instance has
 * its own memory.
 *
 * Fails open: if the database is unreachable the request is allowed, because
 * the endpoints behind this would fail anyway and locking every customer out
 * over a limiter outage is the worse outcome.
 */
export type RateLimitRule = { limit: number; windowSec: number };

export const RULES = {
  loginByIp: { limit: 20, windowSec: 15 * 60 },
  loginByEmail: { limit: 8, windowSec: 15 * 60 },
  register: { limit: 5, windowSec: 60 * 60 },
  contact: { limit: 5, windowSec: 60 * 60 },
  coupon: { limit: 20, windowSec: 10 * 60 },
  checkout: { limit: 10, windowSec: 10 * 60 },
  review: { limit: 10, windowSec: 60 * 60 },
} satisfies Record<string, RateLimitRule>;

export async function rateLimit(
  key: string,
  rule: RateLimitRule
): Promise<{ ok: boolean; retryAfterSec: number }> {
  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${rule.windowSec}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1
                       ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now()
                         THEN now() + make_interval(secs => ${rule.windowSec})
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;

    const row = rows[0];
    if (!row) return { ok: true, retryAfterSec: 0 };

    // Opportunistic cleanup, roughly once per hundred checks.
    if (Math.random() < 0.01) {
      prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < now() - interval '1 day'`.catch(
        () => {}
      );
    }

    const retryAfterSec = Math.max(
      0,
      Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000)
    );
    return { ok: Number(row.count) <= rule.limit, retryAfterSec };
  } catch (error) {
    console.error("[rate-limit] check failed, allowing request", error);
    return { ok: true, retryAfterSec: 0 };
  }
}

/**
 * Best-effort client IP. On Vercel and most proxies the left-most
 * x-forwarded-for entry is the client; locally there is none, so everything
 * shares one bucket, which is fine for development.
 */
export function clientIpFrom(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "local";
}

export async function clientIp(): Promise<string> {
  return clientIpFrom(await headers());
}

export function tooManyMessage(retryAfterSec: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
