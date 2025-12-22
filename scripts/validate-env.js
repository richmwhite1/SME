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
    'OPENAI_API_KEY',
    'DATABASE_PRIVATE_URL',
    'DATABASE_URL',
];

let hasErrors = false;
const warnings = [];

console.log('🔍 Validating environment variables before build...\n');

// Check required variables
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`❌ ERROR: Missing required environment variable: ${varName}`);
        hasErrors = true;
    } else {
        console.log(`✅ ${varName} is set`);
    }
});

// Check database URL (at least one must be present)
if (!process.env.DATABASE_URL && !process.env.DATABASE_PRIVATE_URL) {
    console.error('❌ ERROR: Missing DATABASE_URL or DATABASE_PRIVATE_URL');
    hasErrors = true;
} else {
    if (process.env.DATABASE_PRIVATE_URL) {
        console.log('✅ DATABASE_PRIVATE_URL is set (preferred for Railway)');
    }
    if (process.env.DATABASE_URL) {
        console.log('✅ DATABASE_URL is set');
    }
}

// Check optional variables and warn if missing
optionalEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        warnings.push(varName);
    }
});

if (warnings.length > 0) {
    console.log('\n⚠️  Optional environment variables not set:');
    warnings.forEach((varName) => {
        if (varName === 'OPENAI_API_KEY') {
            console.log(`   - ${varName} (moderation will fail closed - block all content)`);
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
