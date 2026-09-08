import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

/**
 * Protect admin *pages*. Unauthenticated visitors to /admin/* are redirected to
 * the login page (with a `next` param to return them afterward). The login page
 * itself is exempt.
 *
 * Admin *API* routes enforce auth inside each handler (via requireAdmin), which
 * keeps public sub-routes such as GET /api/products/<id>/model reachable without
 * a broad path-based block.
 *
 * Runs on the Edge runtime; auth verification uses Web Crypto (see lib/crypto).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifyAdminSession(token)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
