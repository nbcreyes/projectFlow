export { default } from "next-auth/middleware";

/**
 * Protects all routes under /workspace, /onboarding, /settings,
 * /notifications, and /search.
 * Unauthenticated users are redirected to /login automatically.
 */
export const config = {
  matcher: [
    "/workspace/:path*",
    "/onboarding",
    "/settings/:path*",
    "/notifications",
    "/search",
  ],
};
