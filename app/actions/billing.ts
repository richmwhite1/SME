"use server";

import { stripe } from "@/lib/stripe-config";
import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Ensures the Tiered Metered Price exists in Stripe.
 * Pricing:
 * - Tier 1: Up to 400 units = $100 flat
 * - Tier 2: Over 400 units = $0.25 per unit
 */
async function ensureTieredPrice() {
    // 1. Search for existing product
    const products = await stripe.products.search({
        query: "active:'true' AND name:'SME Brand Verification'",
    });

    let product;
    if (products.data.length > 0) {
        product = products.data[0];
    } else {
        // Create Product
        product = await stripe.products.create({
            name: "SME Brand Verification",
            description: "Brand partnership subscription with performance-based billing.",
        });
    }

    // 2. Search for price
    const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
    });

    // Check if matching tiered price exists
    const existingPrice = prices.data.find(p => p.billing_scheme === 'tiered');
    if (existingPrice) return existingPrice.id;

    // 3. Create Price
    const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        recurring: { interval: 'month', usage_type: 'metered' },
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tiers: [
            { up_to: 400, flat_amount: 10000 }, // $100 for first 400
            { up_to: 'inf', unit_amount: 25 },  // $0.25 per unit after
        ],
        tax_behavior: 'exclusive',
    });

    return price.id;
}

export async function createBillingSession(productId: string, brandEmail: string) {
    if (!productId || !brandEmail) throw new Error("Missing ID or email");

    const db = getDb();

    // Verify product exists and verify user owns it if needed
    // (Skipping ownership check for admin action simplicity, assuming admin calls this)

    try {
        const priceId = await ensureTieredPrice();

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer_email: brandEmail,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                }
            ],
            metadata: {
                productId: productId,
                type: 'brand_verification_tiered'
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?success=billing_setup`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?error=billing_cancelled`,
        });

        if (!session.url) throw new Error("Failed to create session URL");

        return { success: true, url: session.url };

    } catch (error: any) {
        console.error("Error creating billing session:", error);
        return { success: false, error: error.message };
    }
}
