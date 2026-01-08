"use server";

import { getDb } from "@/lib/db";
import { getStripe } from "@/lib/stripe-config";

/**
 * Track product view and report to Stripe for metered billing
 * Called when a verified product page is viewed
 */
export async function trackProductView(productId: string) {
    try {
        const sql = getDb();

        // Get product details including brand owner
        const productResult = await sql`
      SELECT 
        p.id,
        p.title,
        p.brand_owner_id,
        p.is_verified,
        p.visit_count
      FROM products p
      WHERE p.id::text = ${productId}
      LIMIT 1
    `;

        const product = productResult[0];

        if (!product || !product.is_verified || !product.brand_owner_id) {
            // Don't track views for unverified products or products without brand owners
            return { success: false, reason: "Product not eligible for tracking" };
        }

        // Increment visit count
        await sql`
      UPDATE products
      SET 
        visit_count = COALESCE(visit_count, 0) + 1,
        updated_at = NOW()
      WHERE id = ${product.id}
    `;

        // Insert/update daily metrics
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        await sql`
      INSERT INTO product_view_metrics (
        product_id,
        brand_owner_id,
        view_date,
        view_count,
        created_at,
        updated_at
      ) VALUES (
        ${product.id},
        ${product.brand_owner_id},
        ${today},
        1,
        NOW(),
        NOW()
      )
      ON CONFLICT (product_id, view_date)
      DO UPDATE SET
        view_count = product_view_metrics.view_count + 1,
        updated_at = NOW()
    `;

        // Note: Stripe reporting is now handled by a daily cron job
        // app/api/cron/sync-usage/route.ts

        return {
            success: true,
            message: "Product view tracked",
            newCount: (product.visit_count || 0) + 1,
        };
    } catch (error) {
        console.error("❌ Error tracking product view:", error);
        return {
            success: false,
            error: "Failed to track product view",
        };
    }
}

/**
 * Get usage statistics for a brand
 */
export async function getBrandUsageStats(userId: string) {
    try {
        const sql = getDb();

        // Get current month's usage
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        const stats = await sql`
      SELECT 
        COUNT(DISTINCT pvm.product_id) as products_with_views,
        SUM(pvm.view_count) as total_views,
        MAX(pvm.view_date) as last_view_date
      FROM product_view_metrics pvm
      WHERE pvm.brand_owner_id = ${userId}
      AND pvm.view_date >= ${currentMonth}-01
    `;

        const result = stats[0] || {
            products_with_views: 0,
            total_views: 0,
            last_view_date: null,
        };

        // Calculate estimated charge (assuming $0.01 per view)
        const estimatedCharge = Math.max(100, (result.total_views || 0) * 0.01);

        return {
            success: true,
            stats: {
                productsWithViews: result.products_with_views || 0,
                totalViews: result.total_views || 0,
                lastViewDate: result.last_view_date,
                estimatedCharge,
                billingPeriod: currentMonth,
            },
        };
    } catch (error) {
        console.error("❌ Error getting brand usage stats:", error);
        return {
            success: false,
            error: "Failed to get usage stats",
        };
    }
}
