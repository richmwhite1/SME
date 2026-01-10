"use server";

import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Comprehensive schema for brand updates
const productUpdateSchema = z.object({
    id: z.string().uuid(),
    // Core Narrative
    title: z.string().min(1, "Title is required"),
    tagline: z.string().optional(),
    description: z.string().optional(),
    manufacturer: z.string().optional(),

    // Commercial
    price: z.string().optional(),
    buy_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    discount_code: z.string().optional(),

    // Technical & Safety
    serving_info: z.string().optional(),
    warnings: z.string().optional(),
    ingredients: z.string().optional(),

    // Media
    product_photos: z.array(z.string().url()).optional(),

    // Links
    tech_docs_url: z.string().url().optional().or(z.literal("")),
});

export type BrandProductUpdateData = z.infer<typeof productUpdateSchema>;

export async function updateProductBrandFields(data: BrandProductUpdateData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        const sql = getDb();

        // 1. Verify Ownership & Subscription Status
        // Brands can only edit if they are the owner AND have an active subscription
        const verification = await sql`
      SELECT bv.subscription_status
      FROM brand_verifications bv
      WHERE bv.user_id = ${userId}
      AND bv.status = 'approved'
      LIMIT 1
    `;

        if (!verification.length || verification[0].subscription_status !== 'active') {
            return { success: false, error: "Active subscription required to edit products." };
        }

        // 2. Verify Product Ownership
        const productCheck = await sql`
        SELECT id FROM products 
        WHERE id = ${data.id} AND brand_owner_id = ${userId}
        LIMIT 1
    `;

        if (productCheck.length === 0) {
            return { success: false, error: "Product not found or access denied." };
        }

        // 3. Validate Data
        const validData = productUpdateSchema.parse(data);

        // 4. Update Product
        // Note: We intentionally do NOT allow updating is_verified, is_sme_certified, slug, or consensus scores
        await sql`
      UPDATE products
      SET
        title = ${validData.title},
        tagline = ${validData.tagline || null},
        description = ${validData.description || null},
        manufacturer = ${validData.manufacturer || null},
        price = ${validData.price || null},
        buy_url = ${validData.buy_url || null},
        discount_code = ${validData.discount_code || null},
        serving_info = ${validData.serving_info || null},
        warnings = ${validData.warnings || null},
        ingredients = ${validData.ingredients || null},
        product_photos = ${validData.product_photos ? sql.array(validData.product_photos) : null},
        tech_docs = ${validData.tech_docs_url ? JSON.stringify({ url: validData.tech_docs_url }) : null},
        updated_at = NOW()
      WHERE id = ${data.id}
    `;

        revalidatePath("/brand/dashboard");
        revalidatePath(`/products/${data.id}`);

        return { success: true };
    } catch (error) {
        console.error("[Brand Update Error]", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.errors[0].message };
        }
        return { success: false, error: "Failed to update product details" };
    }
}
