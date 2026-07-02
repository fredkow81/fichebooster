export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/stores/:path*",
    "/products/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/optimizations/:path*",
  ],
};
