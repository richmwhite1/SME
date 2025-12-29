'use server';

import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

const sql = neon(process.env.DATABASE_URL!);

interface UpdateProductBrandFieldsParams {
    productId: string;
    buyUrl?: string;
    discountCode?: string;
}

export async function updateProductBrandFields(params: UpdateProductBrandFieldsParams) {
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

        // Verify user owns the product
        const productCheck = await sql`
            SELECT id, brand_owner_id FROM products 
            WHERE id = ${params.productId}
        `;

        if (productCheck.length === 0) {
            return { success: false, error: "Product not found" };
        }

        if (productCheck[0].brand_owner_id !== userId) {
            return { success: false, error: "You do not own this product" };
        }

        // Check subscription status
        const brandVerification = await sql`
            SELECT subscription_status 
            FROM brand_verifications 
            WHERE user_id = ${userId} 
            AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (brandVerification.length === 0) {
            return { success: false, error: "No active brand verification found" };
        }

        const subscriptionStatus = brandVerification[0].subscription_status;
        if (subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled') {
            return {
                success: false,
                error: "Cannot edit product - subscription payment required"
            };
        }

        // Update product fields
        await sql`
            UPDATE products
            SET 
                buy_url = COALESCE(${params.buyUrl}, buy_url),
                discount_code = COALESCE(${params.discountCode}, discount_code),
                updated_at = NOW()
            WHERE id = ${params.productId}
        `;

        // Revalidate the product page and dashboard
        revalidatePath('/brand/dashboard');
        revalidatePath(`/products/${params.productId}`);

        return { success: true };
    } catch (error) {
        console.error("Error updating product brand fields:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update product"
        };
    }
}
