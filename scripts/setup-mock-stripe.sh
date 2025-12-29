#!/bin/bash

# Script to add mock Stripe credentials to .env.local for testing
# This allows you to test the billing system without a real Stripe account

ENV_FILE=".env.local"

echo "🔧 Adding mock Stripe credentials to $ENV_FILE..."
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    echo "Please create .env.local first"
    exit 1
fi

# Backup existing .env.local
cp "$ENV_FILE" "$ENV_FILE.backup"
echo "✅ Created backup: $ENV_FILE.backup"

# Check if Stripe keys already exist
if grep -q "STRIPE_SECRET_KEY" "$ENV_FILE"; then
    echo "⚠️  Stripe credentials already exist in $ENV_FILE"
    echo "Do you want to replace them? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Cancelled. No changes made."
        exit 0
    fi
    
    # Remove existing Stripe keys
    sed -i.tmp '/STRIPE_/d' "$ENV_FILE"
    rm "$ENV_FILE.tmp" 2>/dev/null
fi

# Add mock Stripe credentials
cat >> "$ENV_FILE" << 'EOF'

# ============================================
# Stripe Mock Credentials (For Testing Only)
# ============================================
# These are fake credentials for local development
# Replace with real test keys from Stripe Dashboard when ready

STRIPE_SECRET_KEY=sk_test_mock_secret_key_for_development_only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_mock_publishable_key_for_development
STRIPE_WEBHOOK_SECRET=whsec_mock_webhook_secret_for_local_testing
STRIPE_BRAND_BASE_PRICE_ID=price_mock_brand_base_subscription
STRIPE_SME_CERT_PRICE_ID=price_mock_sme_certification
STRIPE_METERED_PRICE_ID=price_mock_metered_billing

EOF

echo ""
echo "✅ Mock Stripe credentials added to $ENV_FILE"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your Next.js dev server (npm run dev)"
echo "   2. The app will now run without Stripe errors"
echo "   3. Webhook handlers can be tested manually (see testing guide)"
echo ""
echo "⚠️  Note: These are MOCK credentials"
echo "   - Stripe API calls will fail (expected)"
echo "   - Webhook logic can still be tested manually"
echo "   - Database tracking will work normally"
echo ""
echo "🚀 When ready for real testing:"
echo "   1. Create free Stripe test account: https://dashboard.stripe.com/register"
echo "   2. Get real test API keys (pk_test_... and sk_test_...)"
echo "   3. Replace mock credentials in $ENV_FILE"
echo "   4. Install Stripe CLI: brew install stripe/stripe-cli/stripe"
echo ""
