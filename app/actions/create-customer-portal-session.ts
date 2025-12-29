'use server';

import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { createCustomerPortalSession } from "@/lib/stripe-config";

const sql = neon(process.env.DATABASE_URL!);

export async function createBrandCustomerPortalSession() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Verify user is BRAND_REP
        const userProfile = await sql`
            SELECT role FROM profiles WHERE id = ${userId}
        `;

        if (userProfile.length === 0 || userProfile[0].role !== 'BRAND_REP') {
            return { success: false, error: "Unauthorized - BRAND_REP role required" };
        }

        // Get Stripe customer ID
        const brandVerification = await sql`
            SELECT stripe_customer_id 
            FROM brand_verifications 
            WHERE user_id = ${userId} 
            AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (brandVerification.length === 0 || !brandVerification[0].stripe_customer_id) {
            return { success: false, error: "No Stripe customer found" };
        }

        const customerId = brandVerification[0].stripe_customer_id;

        // Create portal session
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const session = await createCustomerPortalSession({
            customerId,
            returnUrl: `${baseUrl}/brand/dashboard`,
        });

        return {
            success: true,
            url: session.url
        };
    } catch (error) {
        console.error("Error creating customer portal session:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create portal session"
        };
    }
}
