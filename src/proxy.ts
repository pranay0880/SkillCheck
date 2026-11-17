import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "skillcheck_admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has(ADMIN_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
