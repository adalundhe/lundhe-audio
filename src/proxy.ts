import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/account", "/orders", "/sessions"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
    // Always run for API routes
    // "/(api|trpc)(.*)",
  ],
}
