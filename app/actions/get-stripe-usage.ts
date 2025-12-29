'use server';

import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { stripe } from "@/lib/stripe-config";

const sql = neon(process.env.DATABASE_URL!);

interface UsageData {
    totalUsage: number;
    periodStart: Date;
    periodEnd: Date;
    subscriptionItemId: string;
}

export async function getStripeUsage() {
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

        // Get user's Stripe subscription
        const brandVerification = await sql`
            SELECT 
                stripe_subscription_id,
                stripe_customer_id,
                subscription_status
            FROM brand_verifications 
            WHERE user_id = ${userId} 
            AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (brandVerification.length === 0) {
            return { success: false, error: "No active brand verification found" };
        }

        const { stripe_subscription_id, subscription_status } = brandVerification[0];

        if (!stripe_subscription_id) {
            return { success: false, error: "No Stripe subscription found" };
        }

        // Fetch subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);

        const currentPeriodStart = new Date(subscription.current_period_start * 1000);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        // Find the metered billing subscription item
        const meteredItem = subscription.items.data.find(
            item => item.price.recurring?.usage_type === 'metered'
        );

        if (!meteredItem) {
            // No metered billing configured - return basic subscription info
            return {
                success: true,
                hasMeteredBilling: false,
                subscriptionStatus: subscription_status,
                currentPeriodStart,
                currentPeriodEnd,
                totalUsage: 0,
                dailyAverage: 0,
                projectedCost: 100, // Base subscription
                perProductUsage: {},
            };
        }

        // Fetch usage record summaries for the current period
        const usageSummaries = await stripe.subscriptionItems.listUsageRecordSummaries(
            meteredItem.id,
            { limit: 1 }
        );

        const currentUsage = usageSummaries.data[0]?.total_usage || 0;

        // Calculate daily average
        const now = new Date();
        const daysInPeriod = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((now.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
        const dailyAverage = daysElapsed > 0 ? Math.round(currentUsage / daysElapsed) : 0;

        // Calculate projected cost
        const baseSubscription = 100; // $100/month
        const perVisitRate = 0.01; // $0.01 per visit
        const usageCost = currentUsage * perVisitRate;
        const projectedCost = Math.max(baseSubscription, usageCost);

        // Get per-product usage from database
        const perProductData = await sql`
            SELECT 
                product_id,
                SUM(view_count) as total_views
            FROM product_view_metrics
            WHERE brand_owner_id = ${userId}
            AND view_date >= ${currentPeriodStart.toISOString().split('T')[0]}
            AND view_date <= ${currentPeriodEnd.toISOString().split('T')[0]}
            GROUP BY product_id
        `;

        const perProductUsage: { [key: string]: number } = {};
        perProductData.forEach((row: any) => {
            perProductUsage[row.product_id] = Number(row.total_views || 0);
        });

        return {
            success: true,
            hasMeteredBilling: true,
            subscriptionStatus: subscription_status,
            currentPeriodStart,
            currentPeriodEnd,
            totalUsage: currentUsage,
            dailyAverage,
            projectedCost,
            perProductUsage,
            subscriptionItemId: meteredItem.id,
            daysInPeriod,
            daysElapsed,
        };
    } catch (error) {
        console.error("Error fetching Stripe usage:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch usage data"
        };
    }
}
