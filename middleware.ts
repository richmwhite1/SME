import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/products(.*)",
  "/discussions(.*)",
  "/feed(.*)",
  "/resources(.*)",
  "/search(.*)", // Added for Global Search
  "/topics(.*)",
  "/topic(.*)",
  "/u(.*)",
  "/api(.*)",
]);

// Clerk internal routes that should always be allowed (handled by Clerk automatically)
const isClerkRoute = createRouteMatcher([
  "/api/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Always allow Clerk's internal routes (sign-in, sign-up, callbacks, webhooks)
  // Clerk middleware handles these automatically
  if (isClerkRoute(req)) {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    
    // If user is not authenticated, redirect to home
    if (!userId) {
      const signInUrl = new URL("/", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};



