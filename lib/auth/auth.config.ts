import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * The half of the auth setup that is safe to run on the Edge.
 *
 * Middleware runs in the Edge runtime, which has no Node built-ins — and
 * bcrypt and the Prisma client both need them. Keeping the providers out of
 * this file means `middleware.ts` can read the session cookie without dragging
 * either into the edge bundle. The full configuration in `auth.ts` spreads
 * this and adds the credentials provider for the Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  // Required on platforms like Vercel, where the host comes from the platform.
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      // Role is written once at sign-in and then read from the token, so no
      // request needs to touch the database just to authorise a page.
      if (user) {
        token.role = (user as { role: Role }).role;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
