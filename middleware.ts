import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/estimate/:path*", "/estimates/:path*", "/setup/:path*", "/templates/:path*", "/invoices/:path*", "/clients/:path*", "/billing/:path*", "/calendar/:path*", "/onboarding/:path*"],
};
