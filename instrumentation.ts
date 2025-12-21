/**
 * Next.js Instrumentation Hook
 * This file runs once when the server starts up
 * Perfect for environment validation and one-time initialization
 */

import { validateAndLogEnvironment } from "./lib/env-validator";

export async function register() {
    // Only run on server-side
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🚀 Initializing server...");
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📍 Runtime: ${process.env.NEXT_RUNTIME}`);

        // Validate environment variables on startup
        try {
            validateAndLogEnvironment();
            console.log("✅ Server initialization complete");
        } catch (error) {
            console.error("❌ Environment validation failed:");
            console.error(error instanceof Error ? error.message : String(error));

            // In production, log the error but allow the server to start
            // This allows Railway to show error pages and logs instead of crashing
            if (process.env.NODE_ENV === "production") {
                console.error("⚠️  Server starting with validation errors - some features may not work");
                console.error("⚠️  Please check Railway environment variables and redeploy");
            } else {
                // In development, we can be more strict
                console.error("💡 Fix the environment variables in .env.local and restart");
            }
        }
    }
}
