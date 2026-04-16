import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

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