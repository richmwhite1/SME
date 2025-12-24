"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateProductSchema = z.object({
    id: z.string().uuid(),
    company_blurb: z.string().optional(),
    product_photos: z.array(z.string().url()).max(10).optional(),
    youtube_link: z
        .string()
        .url()
        .regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
        .nullable()
        .optional(),
    technical_specs: z.record(z.string(), z.string()).optional(),
    category: z.string().optional(),
    name: z.string().optional(),
});

type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export async function updateProductAdmin(data: UpdateProductInput) {
    try {
        // Validate input
        const validated = UpdateProductSchema.parse(data);

        const db = getDb();

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (validated.name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            values.push(validated.name);
            paramIndex++;
        }

        if (validated.category !== undefined) {
            updates.push(`category = $${paramIndex}`);
            values.push(validated.category);
            paramIndex++;
        }

        if (validated.company_blurb !== undefined) {
            updates.push(`company_blurb = $${paramIndex}`);
            values.push(validated.company_blurb);
            paramIndex++;
        }

        if (validated.product_photos !== undefined) {
            updates.push(`product_photos = $${paramIndex}`);
            values.push(JSON.stringify(validated.product_photos));
            paramIndex++;
        }

        if (validated.youtube_link !== undefined) {
            updates.push(`youtube_link = $${paramIndex}`);
            values.push(validated.youtube_link);
            paramIndex++;
        }

        if (validated.technical_specs !== undefined) {
            updates.push(`technical_specs = $${paramIndex}`);
            values.push(JSON.stringify(validated.technical_specs));
            paramIndex++;
        }

        updates.push(`updated_at = NOW()`);

        if (updates.length === 1) {
            // Only updated_at, nothing to update
            return { success: false, error: "No fields to update" };
        }

        // Add product ID as last parameter
        values.push(validated.id);

        await db.unsafe(
            `UPDATE products SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
            values
        );

        revalidatePath(`/admin/products/${validated.id}`);
        revalidatePath("/products");
        revalidatePath(`/products/${validated.id}`);

        return { success: true };
    } catch (error) {
        console.error("Product update error:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map((e) => e.message).join(", "),
            };
        }

        return {
            success: false,
            error: "Failed to update product. Please try again.",
        };
    }
}
