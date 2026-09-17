import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "@/lib/auth/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        // Case-insensitive rather than lowercased: addresses already in the
        // table may have been stored with capitals, and nobody expects
        // "Sam@example.com" to be a different account from "sam@example.com".
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        // Compare even when the account is missing, against a throwaway hash.
        // Returning early on an unknown email makes the two cases take
        // measurably different times, which is enough to enumerate accounts.
        const hash =
          user?.passwordHash ??
          "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const ok = await bcrypt.compare(password, hash);

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
