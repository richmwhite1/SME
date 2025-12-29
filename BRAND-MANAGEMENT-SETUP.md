# Brand Management Infrastructure - Setup & Configuration Guide

## Overview

This guide covers the setup and configuration required to enable the brand management infrastructure, including brand verification, SME certification, and metered billing.

---

## Prerequisites

1. **Stripe Account**: You need an active Stripe account
2. **Database Access**: PostgreSQL database with admin access
3. **Environment Variables**: Access to `.env.local` file

---

## Step 1: Database Migration

Run the brand management schema migration:

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i migrations/brand-management-schema.sql
```

This will create:
- `brand_verifications` table
- `sme_certifications` table
- `product_view_metrics` table
- `stripe_subscriptions` table
- Updates to `profiles` (adds `role` column)
- Updates to `products` (adds brand fields)

---

## Step 2: Stripe Configuration

### 2.1 Create Stripe Products

Log into your Stripe Dashboard and create the following products:

#### Brand Base Subscription
- **Name**: Brand Verification Subscription
- **Pricing**: $100/month recurring
- **Billing Period**: Monthly
- Copy the **Price ID** (starts with `price_`)

#### SME Certification
- **Name**: SME Certification
- **Pricing**: $3,000 one-time
- **Type**: One-time payment
- Copy the **Price ID**

#### Metered Billing (Optional for Phase 6)
- **Name**: Product View Metered Billing
- **Pricing**: Usage-based (configure your rate per view)
- **Billing Period**: Monthly
- Copy the **Price ID**

### 2.2 Get API Keys

From Stripe Dashboard → Developers → API keys:
- Copy **Secret Key** (starts with `sk_test_` or `sk_live_`)
- Copy **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### 2.3 Configure Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

---

## Step 3: Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_BRAND_BASE_PRICE_ID=price_... # $100/month subscription
STRIPE_SME_CERT_PRICE_ID=price_... # $3,000 one-time
STRIPE_METERED_PRICE_ID=price_... # Metered billing (optional)

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # or your production URL
```

---

## Step 4: Install Dependencies

Ensure Stripe SDK is installed:

```bash
npm install stripe
```

---

## Step 5: Test the Integration

### Test Brand Verification Flow

1. Navigate to `/products/new` (product wizard)
2. Complete all 5 steps
3. On Step 5, check "Yes, I represent this brand"
4. Fill in work email, LinkedIn, and company website
5. Submit the form
6. You should be redirected to Stripe Checkout
7. Use test card: `4242 4242 4242 4242`
8. Complete payment
9. Check admin portal → Brand Intake tab
10. Approve the verification

### Test Admin Approval

1. Log in as admin
2. Navigate to `/admin`
3. Click "Brand Intake" tab
4. You should see pending verifications
5. Click "Approve Brand Account"
6. Verify:
   - User role updated to `BRAND_REP`
   - Product `is_verified` set to `true`

---

## Step 6: Verify Webhook Delivery

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Check "Recent events" to see delivered webhooks
4. Verify `checkout.session.completed` events are being received

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is publicly accessible
2. Verify webhook secret is correct in `.env.local`
3. Check Stripe Dashboard for failed webhook attempts
4. Review server logs for webhook errors

### Checkout Session Not Creating

1. Verify Stripe secret key is correct
2. Check price IDs are valid
3. Ensure user is authenticated (Clerk session)
4. Review browser console for errors

### Database Errors

1. Verify migration ran successfully
2. Check table permissions
3. Ensure foreign key constraints are satisfied

---

## Security Considerations

1. **Never commit** `.env.local` to version control
2. Use **test mode** for development
3. Verify webhook signatures to prevent fraud
4. Implement rate limiting on webhook endpoint
5. Use HTTPS in production

---

## Next Steps

After completing setup:

1. **Phase 4**: Implement SME Certification workflow
2. **Phase 5**: Add product UI updates (Buy It Now button, badges)
3. **Phase 6**: Implement metered billing sync

---

## Support

For issues:
1. Check Stripe Dashboard logs
2. Review application logs
3. Verify environment variables
4. Test with Stripe test mode first
