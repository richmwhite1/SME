"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Define the schema matching our new wizard store
const SubmissionSchema = z.object({
    // Step 1: Marketing & Core (only name and category required)
    name: z.string().min(2),
    category: z.string().min(1),
    tagline: z.string().max(100).optional().or(z.literal("")),
    company_blurb: z.string().optional().or(z.literal("")),

    // Step 2: Visuals & Media
    product_photos: z.array(z.string().url()).default([]),
    video_url: z.string().url().optional().or(z.literal("")),
    technical_docs_url: z.string().url().optional().or(z.literal("")),

    // Step 3: SME Assessment Prep (all optional)
    target_audience: z.string().optional().or(z.literal("")),
    core_value_proposition: z.string().optional().or(z.literal("")),
    technical_specs: z.array(z.object({
        key: z.string().min(1),
        value: z.string().min(1)
    })).default([]),
    sme_access_note: z.string().optional().or(z.literal("")),
    technical_docs_url: z.string().url().optional().or(z.literal("")),

    // Step 4: Signals
    sme_signals: z.record(z.string(), z.any()).optional(),
});

export async function submitProductWizard(formData: FormData) {
    const user = await currentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        category: formData.get("category"),
        tagline: formData.get("tagline"),
        company_blurb: formData.get("company_blurb"),
        product_photos: JSON.parse(formData.get("product_photos") as string || "[]"),
        video_url: formData.get("video_url"),
        technical_docs_url: formData.get("technical_docs_url"),
        target_audience: formData.get("target_audience"),
        core_value_proposition: formData.get("core_value_proposition"),
        technical_specs: JSON.parse(formData.get("technical_specs") as string || "[]"),
        sme_access_note: formData.get("sme_access_note"),
        sme_signals: JSON.parse(formData.get("sme_signals") as string || "{}"),
    };

    const validation = SubmissionSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error("Validation failed: " + JSON.stringify(validation.error.flatten().fieldErrors));
    }

    const data = validation.data;
    const sql = getDb();

    // Generate slug
    const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);

    try {
        const result = await sql`
            INSERT INTO products (
                title,
                category,
                tagline,
                company_blurb,
                product_photos,
                youtube_link,
                technical_docs_url,
                target_audience,
                core_value_proposition,
                technical_specs,
                sme_access_note,
                sme_signals,
                truth_evidence_urls,
                slug,
                created_by,
                admin_status,
                insight_trigger_upvote_threshold,
                insight_trigger_reputation_tier
            ) VALUES (
                ${data.name},
                ${data.category},
                ${data.tagline || null},
                ${data.company_blurb || null},
                ${data.product_photos},
                ${data.video_url || null},
                ${data.technical_docs_url || null},
                ${data.target_audience || null},
                ${data.core_value_proposition || null},
                ${JSON.stringify(data.technical_specs)},
                ${data.sme_access_note || null},
                ${JSON.stringify(data.sme_signals || {})},
                ${JSON.stringify(Object.values(data.sme_signals || {}).map((s: any) => s.evidence).filter(Boolean))},
                ${slug},
                ${user.id},
                'pending_review',
                5,
                1
            )
            RETURNING id, slug
        `;

        const newProduct = result[0];

        revalidatePath("/products");
        return { success: true, productId: newProduct.id, slug: newProduct.slug };

    } catch (error: any) {
        console.error("Error creating product:", error);
        throw new Error("Database error: " + error.message);
    }
}
