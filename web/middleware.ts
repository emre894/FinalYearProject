// web/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // This function runs after authentication check
    // If we get here, the user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // User is authorized if token exists (they're logged in)
        return !!token;
      },
    },
  }
);

// Protect these routes - redirect to /login if not authenticated
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