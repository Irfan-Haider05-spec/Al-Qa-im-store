import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

// Edge-level gate. Fine-grained permission checks still happen server-side
// in each action/route — this is the first, coarse barrier.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const isAdminPath = pathname.startsWith("/admin");
  const isAccountPath = pathname.startsWith("/account");

  if (isAdminPath) {
    if (!user || user.role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/login?from=admin", req.url));
    }
  }

  if (isAccountPath && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
