import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getStripe, reportMeteredUsage } from "@/lib/stripe-config";

// Force dynamic to ensure it runs every time
export const dynamic = "force-dynamic";

/**
 * Cron job to sync pending product views to Stripe
 * Can be called manually with ?dryRun=true to see what would happen
 * 
 * Logic:
 * 1. Find all unsynced product views in product_view_metrics
 * 2. Group by brand owner
 * 3. Fetch Stripe subscription for each brand
 * 4. Report usage to Stripe
 * 5. Mark records as synced
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const isDryRun = searchParams.get("dryRun") === "true";
    const authHeader = req.headers.get("authorization");

    // Simple security check (replace with proper CRON_SECRET in production)
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow local dev without secret
        if (process.env.NODE_ENV !== "development") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const sql = getDb();
        const stripe = getStripe();

        // 1. Get aggregated unsynced views by brand_owner_id
        // We aggregate first to minimize database queries and Stripe calls
        const unsyncedViews = await sql`
      SELECT 
        brand_owner_id, 
        SUM(view_count) as pending_views,
        ARRAY_AGG(id) as metric_ids
      FROM product_view_metrics
      WHERE synced_to_stripe = false
      GROUP BY brand_owner_id
    `;

        if (unsyncedViews.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No unsynced views found",
                processed: 0
            });
        }

        const results = [];
        let totalSynced = 0;

        // 2. Process each brand
        for (const brandGroup of unsyncedViews) {
            const { brand_owner_id, pending_views, metric_ids } = brandGroup;
            const viewCount = Number(pending_views);

            if (viewCount <= 0) continue;

            try {
                // Get active subscription
                const brandVerification = await sql`
          SELECT 
            stripe_subscription_id,
            stripe_customer_id
          FROM brand_verifications
          WHERE user_id = ${brand_owner_id}
          AND status = 'approved'
          AND subscription_status = 'active'
          LIMIT 1
        `;

                if (brandVerification.length === 0 || !brandVerification[0].stripe_subscription_id) {
                    results.push({
                        brand_owner_id,
                        status: "skipped",
                        reason: "No active subscription",
                        views: viewCount
                    });
                    continue;
                }

                const { stripe_subscription_id } = brandVerification[0];

                if (isDryRun) {
                    results.push({
                        brand_owner_id,
                        stripe_subscription_id,
                        status: "dry_run",
                        views: viewCount,
                        message: `Would report ${viewCount} views`
                    });
                    continue;
                }

                // Get subscription items to find metered price
                const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);
                const meteredItem = subscription.items.data.find(
                    (item) => item.price.id === process.env.STRIPE_METERED_PRICE_ID
                );

                if (!meteredItem) {
                    results.push({
                        brand_owner_id,
                        stripe_subscription_id,
                        status: "error",
                        reason: "Metered price item not found in subscription",
                        views: viewCount
                    });
                    continue;
                }

                // 3. Report usage to Stripe
                // We use set functionality to ensure idempotency if we run multiple times
                // timestamp must be within current billing period, so using now is safest
                await reportMeteredUsage({
                    subscriptionItemId: meteredItem.id,
                    quantity: viewCount,
                    action: "increment",
                    timestamp: Math.floor(Date.now() / 1000),
                });

                // 4. Mark records as synced
                await sql`
            UPDATE product_view_metrics
            SET 
              synced_to_stripe = true,
              synced_at = NOW(),
              updated_at = NOW()
            WHERE id = ANY(${metric_ids}::uuid[])
          `;

                totalSynced += viewCount;
                results.push({
                    brand_owner_id,
                    stripe_subscription_id,
                    status: "success",
                    views: viewCount
                });

            } catch (error) {
                console.error(`Error processing brand ${brand_owner_id}:`, error);
                results.push({
                    brand_owner_id,
                    status: "error",
                    error: error instanceof Error ? error.message : "Unknown error",
                    views: viewCount
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: unsyncedViews.length,
            total_views_synced: totalSynced,
            results: results
        });

    } catch (error) {
        console.error("Cron job failed:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
