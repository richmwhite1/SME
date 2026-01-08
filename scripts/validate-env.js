#!/usr/bin/env node

/**
 * Pre-build validation script
 * Validates that required environment variables are present before building
 * This prevents wasted build time if critical variables are missing
 */

const requiredEnvVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
];

const optionalEnvVars = [
    'GOOGLE_AI_API_KEY', // Replaces OPENAI_API_KEY
    'DATABASE_PRIVATE_URL',
    'DATABASE_URL',
];

// ... (existing code)

if (warnings.length > 0) {
    console.log('\n⚠️  Optional environment variables not set:');
    warnings.forEach((varName) => {
        if (varName === 'GOOGLE_AI_API_KEY') {
            console.log(`   - ${varName} (AI moderation and features will be disabled)`);
        } else {
            console.log(`   - ${varName}`);
        }
    });
}

if (hasErrors) {
    console.error('\n❌ Build validation failed. Please set the required environment variables.');
    process.exit(1);
}

console.log('\n✅ Environment validation passed. Proceeding with build...\n');
