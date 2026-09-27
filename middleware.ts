import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { isRoleAllowedForAdminPath } from "@/lib/authorization/route-policy";
import { isAppRole } from "@/lib/authorization/roles";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  const role = token?.role;

  if (!role || !isAppRole(role)) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isRoleAllowedForAdminPath(role, pathname)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/content/:path*",
    "/media/:path*",
    "/master-data/:path*",
    "/applications/:path*",
    "/results-management/:path*",
    "/dashboard/:path*",
  ],
};
