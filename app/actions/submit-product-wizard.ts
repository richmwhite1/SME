"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { submitBrandVerification } from "./brand-verification-actions";
import { calculatePillarScores } from "@/lib/pillar-score-calculator";

const ProductWizardSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"), // Keep for backward compatibility
    primary_category: z.string().min(1, "Primary category is required"),
    secondary_categories: z.object({
        conditions: z.array(z.string()).default([]),
        goals: z.array(z.string()).default([]),
        ingredients: z.array(z.string()).default([]),
        forms: z.array(z.string()).default([])
    }).optional(),
    company_blurb: z.string().min(10, "Company blurb must be at least 10 characters"),
    manufacturer: z.string().optional().or(z.literal("")),
    price: z.string().optional().or(z.literal("")),
    // serving_info: z.string().optional().or(z.literal("")), // Deprecated
    serving_size: z.string().optional().or(z.literal("")),
    servings_per_container: z.string().optional().or(z.literal("")),
    form: z.string().optional().or(z.literal("")),
    recommended_dosage: z.string().optional().or(z.literal("")),
    best_time_take: z.string().optional().or(z.literal("")),
    storage_instructions: z.string().optional().or(z.literal("")),
    warnings: z.string().optional().or(z.literal("")),
    certifications: z.array(z.string()).optional().default([]),
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
    // NEW: Active Ingredients & Technical Specs
    active_ingredients: z.array(z.object({
        name: z.string(),
        dosage: z.string().optional()
    })),
    third_party_lab_link: z.string().url().nullable().optional().or(z.literal("")),
    excipients: z.array(z.string()),
    // NEW: Benefits
    benefits: z.array(z.object({
        title: z.string(),
        type: z.enum(["anecdotal", "evidence_based"]),
        citation: z.string().url().nullable().optional().or(z.literal(""))
    })),
    // NEW: Allergens and Dietary Tags
    allergens: z.array(z.string()).optional().default([]),
    dietary_tags: z.array(z.string()).optional().default([]),
    sme_access_notes: z.string().nullable().optional(),
    sme_signals: z.record(z.string(), z.any()).optional(),
    // Brand verification fields
    is_brand_owner: z.boolean().optional(),
    work_email: z.string().email().optional().or(z.literal("")),
    linkedin_profile: z.string().optional().or(z.literal("")),
    company_website: z.string().url().optional().or(z.literal("")),
});

type ProductWizardInput = z.infer<typeof ProductWizardSchema>;

export async function submitProductWizard(data: ProductWizardInput) {
    try {
        // Validate input
        const validated = ProductWizardSchema.parse(data);

        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        const db = getDb();

        // Generate slug from product name
        const slug = validated.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Calculate pillar scores from active ingredients
        const pillarScores = calculatePillarScores((validated.active_ingredients as any) || []);

        // Construct legacy ingredients text string
        const ingredientsText = (validated.active_ingredients || [])
            .map((ing) => ing.dosage ? `${ing.name} - ${ing.dosage}` : ing.name)
            .join("\n");

        // Construct serving info string if needed (for backwards compatibility)
        const servingInfoCombined = `${validated.serving_size || ''} ${validated.servings_per_container ? `(${validated.servings_per_container} servings)` : ''}`.trim();

        // Insert product into database
        const result = await db`
      INSERT INTO products (
        name,
        title,
        slug,
        category,
        primary_category,
        secondary_categories,
        brand,
        manufacturer,
        price,
        company_blurb,
        product_photos,
        youtube_link,
        technical_docs_url,
        target_audience,
        core_value_proposition,
        technical_specs,
        active_ingredients,
        ingredients,
        third_party_lab_link,
        excipients,
        warnings,
        certifications,
        allergens,
        dietary_tags,
        pillar_scores,
        sme_access_note,
        sme_signals,
        serving_size,
        servings_per_container,
        form,
        recommended_dosage,
        best_time_take,
        storage_instructions,
        serving_info,
        created_at,
        updated_at
      ) VALUES (
        ${validated.name},
        ${validated.name},
        ${slug},
        ${validated.category},
        ${validated.primary_category},
        ${JSON.stringify(validated.secondary_categories || { conditions: [], goals: [], ingredients: [], forms: [] })},
        ${validated.name.split(" ")[0]},
        ${validated.manufacturer || null},
        ${validated.price || null},
        ${validated.company_blurb},
        ${validated.product_photos},
        ${validated.youtube_link || null},
        ${validated.technical_docs_url || null},
        ${validated.target_audience},
        ${validated.core_value_proposition},
        ${JSON.stringify(validated.technical_specs)},
        ${JSON.stringify(validated.active_ingredients || [])},
        ${ingredientsText},
        ${validated.third_party_lab_link || null},
        ${JSON.stringify(validated.excipients || [])},
        ${validated.warnings || null},
        ${JSON.stringify(validated.certifications || [])},
        ${JSON.stringify(validated.allergens || [])},
        ${JSON.stringify(validated.dietary_tags || [])},
        ${JSON.stringify(pillarScores)},
        ${validated.sme_access_notes || null},
        ${JSON.stringify(validated.sme_signals || {})},
        ${validated.serving_size || null},
        ${validated.servings_per_container || null},
        ${validated.form || null},
        ${validated.recommended_dosage || null},
        ${validated.best_time_take || null},
        ${validated.storage_instructions || null},
        ${servingInfoCombined || null},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

        const productId = result[0].id;

        // Insert benefits into product_benefits table
        if (validated.benefits && validated.benefits.length > 0) {
            for (const benefit of validated.benefits) {
                await db`
                    INSERT INTO product_benefits (
                        product_id,
                        benefit_title,
                        benefit_type,
                        citation_url,
                        source_type,
                        submitted_by,
                        is_verified
                    ) VALUES (
                        ${productId}::uuid,
                        ${benefit.title},
                        ${benefit.type},
                        ${benefit.citation || null},
                        'official',
                        ${userId},
                        false
                    )
                `;
            }
        }

        // Handle brand verification if user claimed ownership
        if (validated.is_brand_owner && validated.work_email && validated.linkedin_profile && validated.company_website) {
            const verificationResult = await submitBrandVerification({
                productId,
                workEmail: validated.work_email,
                linkedinProfile: validated.linkedin_profile,
                companyWebsite: validated.company_website,
                intentionStatement: validated.company_blurb,
            });

            if (!verificationResult.success) {
                // Brand verification failed, but product was created
                return {
                    success: true,
                    productId,
                    warning: "Product created, but brand verification failed. You can try again from your dashboard.",
                };
            }
        }

        revalidatePath("/products");
        revalidatePath("/admin/dashboard");

        return {
            success: true,
            productId,
            requiresPayment: false,
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
