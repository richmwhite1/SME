"use server";

import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { createCustomerPortalSession } from "@/lib/stripe-config";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Create a Stripe Customer Portal session for brand to manage billing
 */
export async function createPortalSession() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Get brand verification with Stripe customer ID
        const result = await sql`
      SELECT stripe_customer_id
      FROM brand_verifications
      WHERE user_id = ${userId}
      AND status = 'approved'
      LIMIT 1
    `;

        if (result.length === 0 || !result[0].stripe_customer_id) {
            return { success: false, error: "No active brand subscription found" };
        }

        const { stripe_customer_id } = result[0];

        // Create portal session
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const session = await createCustomerPortalSession({
            customerId: stripe_customer_id,
            returnUrl: `${baseUrl}/brand/dashboard`,
        });

        return {
            success: true,
            url: session.url,
        };
    } catch (error) {
        console.error("Error creating portal session:", error);
        return {
            success: false,
            error: "Failed to create portal session",
        };
    }
}
