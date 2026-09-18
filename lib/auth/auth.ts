import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "@/lib/auth/auth.config";
import { RULES, clientIpFrom, rateLimit } from "@/lib/security/rate-limit";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  // Capped: bcrypt only reads 72 bytes, and hashing megabytes is a cheap DoS.
  password: z.string().min(8).max(128),
});

// A real hash of a random string, compared against when the email is unknown so
// both paths cost one full bcrypt round. A malformed placeholder would make
// bcrypt bail out instantly and bring the timing difference right back.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), 10);

/**
 * The full auth setup, for the Node runtime only.
 *
 * `middleware.ts` deliberately imports `auth.config.ts` instead — see the note
 * there. Importing this module from middleware would pull bcrypt and Prisma
 * into the Edge bundle, where neither can run.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Throttled here rather than in the login form's server action, so the
        // Auth.js callback endpoint cannot be used to go around it. Both an IP
        // bucket (one machine guessing many accounts) and an account bucket
        // (many machines guessing one password) apply.
        const ip = clientIpFrom(request.headers);
        const [byIp, byEmail] = await Promise.all([
          rateLimit(`login:ip:${ip}`, RULES.loginByIp),
          rateLimit(`login:email:${email.toLowerCase()}`, RULES.loginByEmail),
        ]);
        if (!byIp.ok || !byEmail.ok) return null;

        // Case-insensitive rather than lowercased: addresses already in the
        // table may have been stored with capitals, and nobody expects
        // "Sam@example.com" to be a different account from "sam@example.com".
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        // Compare even when the account is missing, against a throwaway hash.
        // Returning early on an unknown email makes the two cases take
        // measurably different times, which is enough to enumerate accounts.
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
});
