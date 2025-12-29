import Stripe from 'stripe';

// Initialize Stripe with API key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
});

// Export function to get Stripe instance
export function getStripe() {
    return stripe;
}

// Stripe Product and Price IDs
// These should be created in your Stripe Dashboard and added to .env.local
export const STRIPE_PRODUCTS = {
    BRAND_BASE_SUBSCRIPTION: {
        priceId: process.env.STRIPE_BRAND_BASE_PRICE_ID || '',
        amount: 10000, // $100 in cents
        interval: 'month' as const,
    },
    SME_CERTIFICATION: {
        priceId: process.env.STRIPE_SME_CERT_PRICE_ID || '',
        amount: 300000, // $3,000 in cents
        type: 'one_time' as const,
    },
    METERED_BILLING: {
        priceId: process.env.STRIPE_METERED_PRICE_ID || '',
        // Price per product view - configure in Stripe Dashboard
    },
};

// Webhook secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Create a Stripe checkout session for brand base subscription
 */
export async function createBrandSubscriptionCheckout(params: {
    userId: string;
    userEmail: string;
    productId: string;
    verificationId: string;
    successUrl: string;
    cancelUrl: string;
}) {
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: params.userEmail,
        line_items: [
            {
                price: STRIPE_PRODUCTS.BRAND_BASE_SUBSCRIPTION.priceId,
                quantity: 1,
            },
        ],
        metadata: {
            userId: params.userId,
            productId: params.productId,
            verificationId: params.verificationId,
            type: 'brand_verification',
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        allow_promotion_codes: true,
    });

    return session;
}

/**
 * Create a Stripe checkout session for SME certification (one-time payment)
 */
export async function createSMECertificationCheckout(params: {
    userId: string;
    userEmail: string;
    productId: string;
    certificationId: string;
    successUrl: string;
    cancelUrl: string;
}) {
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: params.userEmail,
        line_items: [
            {
                price: STRIPE_PRODUCTS.SME_CERTIFICATION.priceId,
                quantity: 1,
            },
        ],
        metadata: {
            userId: params.userId,
            productId: params.productId,
            certificationId: params.certificationId,
            type: 'sme_certification',
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
    });

    return session;
}

/**
 * Report metered billing usage to Stripe
 */
export async function reportMeteredUsage(params: {
    subscriptionItemId: string;
    quantity: number;
    timestamp?: number;
    action?: 'increment' | 'set';
}) {
    const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
        params.subscriptionItemId,
        {
            quantity: params.quantity,
            timestamp: params.timestamp || Math.floor(Date.now() / 1000),
            action: params.action || 'increment',
        }
    );

    return usageRecord;
}

/**
 * Get or create a Stripe customer
 */
export async function getOrCreateCustomer(params: {
    userId: string;
    email: string;
    name?: string;
}) {
    // Search for existing customer by metadata
    const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
            userId: params.userId,
        },
    });

    return customer;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, immediately = false) {
    if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
    } else {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Get customer details
 */
export async function getCustomer(customerId: string) {
    return await stripe.customers.retrieve(customerId);
}

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage their subscription, payment methods, and invoices
 */
export async function createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
}) {
    const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
    });

    return session;
}
