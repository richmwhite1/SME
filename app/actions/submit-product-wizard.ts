"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProductWizardSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    company_blurb: z.string().min(10, "Company blurb must be at least 10 characters"),
    product_photos: z.array(z.string().url()).max(10, "Maximum 10 photos allowed"),
    youtube_link: z
        .string()
        .refine(
            (val) => {
                if (!val || val.trim() === "") return true;
                return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(val);
            },
            { message: "Must be a valid YouTube URL" }
        )
        .nullable()
        .optional(),
    technical_docs_url: z.string().url().nullable().optional().or(z.literal("")),
    target_audience: z.string(),
    core_value_proposition: z.string(),
    technical_specs: z.record(z.string(), z.string()),
    sme_access_notes: z.string().nullable().optional(),
    sme_signals: z.record(z.string(), z.any()).optional(),
});

type ProductWizardInput = z.infer<typeof ProductWizardSchema>;

export async function submitProductWizard(data: ProductWizardInput) {
    try {
        // Validate input
        const validated = ProductWizardSchema.parse(data);

        const db = getDb();

        // Generate slug from product name
        const slug = validated.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Insert product into database
        const result = await db`
      INSERT INTO products (
        name,
        title,
        slug,
        category,
        brand,
        company_blurb,
        product_photos,
        youtube_link,
        technical_docs_url,
        target_audience,
        core_value_proposition,
        technical_specs,
        sme_access_note,
        sme_signals,
        created_at,
        updated_at
      ) VALUES (
        ${validated.name},
        ${validated.name},
        ${slug},
        ${validated.category},
        ${validated.name.split(" ")[0]}, -- Use first word as brand placeholder
        ${validated.company_blurb},
        ${validated.product_photos},
        ${validated.youtube_link || null},
        ${validated.technical_docs_url || null},
        ${validated.target_audience},
        ${validated.core_value_proposition},
        ${JSON.stringify(validated.technical_specs)},
        ${validated.sme_access_notes || null},
        ${JSON.stringify(validated.sme_signals || {})},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

        revalidatePath("/products");
        revalidatePath("/admin/dashboard");

        return {
            success: true,
            productId: result[0].id,
        };
    } catch (error) {
        console.error("Product wizard submission error:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map((e) => e.message).join(", "),
            };
        }

        return {
            success: false,
            error: "Failed to submit product. Please try again.",
        };
    }
}
