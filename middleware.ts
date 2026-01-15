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
  "/community(.*)",
  "/leaderboard(.*)",
  "/how-it-works(.*)",
  "/standards(.*)",
  "/sme-standards(.*)",
  "/terms(.*)",
  "/disclaimer(.*)",
  "/brand-standards(.*)",
  "/brand-partner-standards(.*)",
  "/get-certified(.*)",
  "/list-your-product(.*)",
  "/sme-citations(.*)",
  "/contact(.*)",
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

  const hostname = req.nextUrl.hostname;
  // Redirect www to non-www (canonical) for production
  // We check if it's strictly 'www.thehealthsme.com' to be safe, or just starts with www
  if (hostname === 'www.thehealthsme.com') {
    const url = req.nextUrl.clone();
    url.hostname = 'thehealthsme.com';
    return NextResponse.redirect(url);
  }

  // Allow public routes without authentication
  if (!isPublicRoute(req)) {
    // Protect routes that are not public
    // This will automatically redirect to the sign-in page if the user is not authenticated
    (await auth()).protect();
  }

  // Add the current path to the headers for server components to read
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-current-path", req.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};



