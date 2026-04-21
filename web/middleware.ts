import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isProtected = [
    "/dashboard",
    "/upload",
    "/insights",
    "/forecast",
    "/patterns",
    "/reports",
    "/settings",
  ].some((path) => req.nextUrl.pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/upload/:path*",
    "/insights",
    "/forecast",
    "/patterns",
    "/reports",
    "/settings",
  ],
};