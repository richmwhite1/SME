"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Increment the view count for a product
 */
export async function incrementProductView(productId: string) {
    const sql = getDb();

    try {
        await sql`
      UPDATE products
      SET view_count = view_count + 1
      WHERE id = ${productId}
    `;
        // We generally don't revalidate path for view counts to avoid thrashing cache
        return { success: true };
    } catch (error) {
        console.error("Error incrementing product view:", error);
        return { success: false, error: 'Failed to increment view' };
    }
}

/**
 * Increment the click count for a product's external link
 */
export async function incrementProductClick(productId: string) {
    const sql = getDb();

    try {
        await sql`
      UPDATE products
      SET click_count = click_count + 1
      WHERE id = ${productId}
    `;
        return { success: true };
    } catch (error) {
        console.error("Error incrementing product click:", error);
        return { success: false, error: 'Failed to increment click' };
    }
}
