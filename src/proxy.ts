import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import type { UserRole } from "~/types/roles"

const isProtectedRoute = createRouteMatcher(["/account(.*)", "/orders(.*)", "/sessions(.*)"])

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    // Force sign-in first so we always have populated sessionClaims to read.
    await auth.protect()

    const { sessionClaims } = await auth()
    const role = sessionClaims?.metadata?.role as UserRole | undefined

    if (role !== "admin") {
      // Non-admins land on their own dashboard rather than a confusing 404.
      const url = req.nextUrl.clone()
      url.pathname = "/account"
      url.search = ""
      return NextResponse.redirect(url)
    }

    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
