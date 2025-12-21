/**
 * Environment variable validator
 * Validates required environment variables on application startup
 * Ensures the app fails fast with clear error messages if critical variables are missing
 */

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateEnvironmentVariables(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Database URL validation - at least one must be present
    if (!process.env.DATABASE_URL && !process.env.DATABASE_PRIVATE_URL) {
        errors.push(
            "Missing DATABASE_URL or DATABASE_PRIVATE_URL. Please configure your Postgres connection string."
        );
    }

    // Clerk authentication validation
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        errors.push(
            "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Clerk authentication will not work."
        );
    }

    if (!process.env.CLERK_SECRET_KEY) {
        errors.push(
            "Missing CLERK_SECRET_KEY. Server-side Clerk operations will fail."
        );
    }

    // OpenAI API key - optional but warn if missing
    if (!process.env.OPENAI_API_KEY) {
        warnings.push(
            "Missing OPENAI_API_KEY. Content moderation will fail closed (block all content for safety)."
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates environment variables and logs results
 * Throws an error if validation fails
 */
export function validateAndLogEnvironment(): void {
    const result = validateEnvironmentVariables();

    // Log which variables are present (without showing values for security)
    console.log("🔍 Environment Variable Status:");

    // Check and log database URLs
    if (process.env.DATABASE_PRIVATE_URL) {
        console.log("   ✅ DATABASE_PRIVATE_URL is set (preferred for Railway)");
    } else if (process.env.DATABASE_URL) {
        console.log("   ✅ DATABASE_URL is set");
    } else {
        console.log("   ❌ DATABASE_URL/DATABASE_PRIVATE_URL is MISSING");
    }

    // Check and log Clerk keys
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        console.log("   ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set");
    } else {
        console.log("   ❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is MISSING");
    }

    if (process.env.CLERK_SECRET_KEY) {
        console.log("   ✅ CLERK_SECRET_KEY is set");
    } else {
        console.log("   ❌ CLERK_SECRET_KEY is MISSING");
    }

    // Check and log OpenAI key
    if (process.env.OPENAI_API_KEY) {
        console.log("   ✅ OPENAI_API_KEY is set");
    } else {
        console.log("   ⚠️  OPENAI_API_KEY is MISSING (optional)");
    }

    // Log warnings
    if (result.warnings.length > 0) {
        console.warn("\n⚠️  Environment Variable Warnings:");
        result.warnings.forEach((warning) => {
            console.warn(`   - ${warning}`);
        });
    }

    // Log errors and throw if validation failed
    if (!result.isValid) {
        console.error("\n❌ Environment Variable Validation Failed:");
        result.errors.forEach((error) => {
            console.error(`   - ${error}`);
        });
        throw new Error(
            `Environment validation failed. Missing required variables: ${result.errors.join(", ")}`
        );
    }

    console.log("✅ Environment variables validated successfully");
}
