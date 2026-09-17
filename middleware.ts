import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

// Built from the edge-safe half of the auth config: middleware only needs to
// read the JWT, never to verify a password, so bcrypt and Prisma stay out of
// the Edge bundle (they cannot run there).
const { auth } = NextAuth(authConfig);

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"]);

/**
 * The coarse gate in front of the private areas.
 *
 * This is the first barrier, not the only one: every admin action re-checks
 * the caller's permission server-side, because middleware alone protects
 * routes, not the mutations those routes call.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/admin")) {
    if (!user || !ADMIN_ROLES.has(String(user.role))) {
      return NextResponse.redirect(new URL("/login?from=admin", req.url));
    }
  }

  if (pathname.startsWith("/account") && !user) {
    // Send them back where they were once they've signed in.
    const next = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
