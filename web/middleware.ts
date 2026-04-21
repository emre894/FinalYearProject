import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
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