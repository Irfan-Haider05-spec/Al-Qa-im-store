import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "@/lib/auth/auth.config";
import { RULES, clientIpFrom, rateLimit } from "@/lib/security/rate-limit";
import { attachGuestActivity } from "@/lib/auth/on-sign-in";
import { googleClientId, googleClientSecret, isGoogleEnabled } from "@/lib/auth/providers";

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

        // A Google-created account has no password here; it can only sign in
        // through Google.
        if (!user || !user.passwordHash || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
    // Offered only when the credentials are configured, so a store without
    // them shows no dead button.
    ...(isGoogleEnabled()
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // Always let people choose the account, rather than silently
            // reusing whichever one the browser is already signed into.
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,

    /**
     * There is no database adapter (sessions are JWTs), so a Google sign-in
     * has to create the customer row itself — otherwise there would be
     * nothing to hang orders, addresses or a wishlist on.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      // An unverified Google address could belong to someone else.
      if (!email || profile?.email_verified === false) return false;

      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, name: true },
      });

      if (!existing) {
        await prisma.user.create({
          data: { email, name: user.name ?? null, role: "CUSTOMER" },
        });
      } else if (!existing.name && user.name) {
        await prisma.user.update({ where: { id: existing.id }, data: { name: user.name } });
      }
      return true;
    },

    /**
     * The token must carry *our* user id and role. For Google that means
     * looking the row up by email, because the provider's id is its own.
     * Only runs at sign-in (`user` is set), never on the Edge.
     */
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google") {
        const row = await prisma.user.findFirst({
          where: { email: { equals: user.email ?? "", mode: "insensitive" } },
          select: { id: true, role: true },
        });
        if (row) {
          token.id = row.id;
          token.role = row.role as Role;
        }
        return token;
      }
      return authConfig.callbacks.jwt({ token, user, account });
    },
  },
  events: {
    /**
     * Pick up what the customer did before signing in: orders placed as a
     * guest with this email, and anything left in the guest basket.
     */
    async signIn({ user }) {
      await attachGuestActivity(user.email);
    },
  },
});
