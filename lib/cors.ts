import { NextResponse } from "next/server";

/**
 * Allowed origins for CORS requests
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

/**
 * Add CORS headers to a NextResponse for API routes
 * @param response - The NextResponse to add headers to
 * @param origin - The origin from the request header
 * @returns The response with CORS headers added
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  // Use the request origin if it's allowed, otherwise use the first allowed origin
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  response.headers.set(
    "Access-Control-Allow-Origin",
    allowedOrigin || "http://localhost:3000"
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

/**
 * Handle CORS preflight requests (OPTIONS)
 * @param origin - The origin from the request header
 * @returns A NextResponse with CORS headers for preflight
 */
export function handleCorsPreflight(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}






