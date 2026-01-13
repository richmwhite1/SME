"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createBrandSubscriptionCheckout } from "@/lib/stripe-config";
import { calculatePillarScores } from "@/lib/pillar-score-calculator";

const ProductWizardSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
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
    active_ingredients: z.array(z.object({
        name: z.string(),
        dosage: z.string().optional()
    })),
    third_party_lab_link: z.string().url().nullable().optional().or(z.literal("")),
    excipients: z.array(z.string()),
    benefits: z.array(z.object({
        title: z.string(),
        type: z.enum(["anecdotal", "evidence_based"]),
        citation: z.string().url().nullable().optional().or(z.literal(""))
    })),
    allergens: z.array(z.string()).optional().default([]),
    dietary_tags: z.array(z.string()).optional().default([]),
    sme_access_notes: z.string().nullable().optional(),
    sme_signals: z.record(z.string(), z.any()).optional(),
    is_brand_owner: z.boolean().optional(),
    work_email: z.string().email().optional().or(z.literal("")),
    linkedin_profile: z.string().optional().or(z.literal("")),
    company_website: z.string().url().optional().or(z.literal("")),
});

type ProductWizardInput = z.infer<typeof ProductWizardSchema>;

export async function submitProductWizard(data: ProductWizardInput) {
    try {
        const validated = ProductWizardSchema.parse(data);
        const user = await currentUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const db = getDb();

        // Generate slug
        const slug = validated.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const pillarScores = calculatePillarScores((validated.active_ingredients as any) || []);

        const ingredientsText = (validated.active_ingredients || [])
            .map((ing) => ing.dosage ? `${ing.name} - ${ing.dosage}` : ing.name)
            .join("\n");

        const servingInfoCombined = `${validated.serving_size || ''} ${validated.servings_per_container ? `(${validated.servings_per_container} servings)` : ''}`.trim();

        // Check if user is submitting as brand owner
        const isBrandSubmission = validated.is_brand_owner && validated.work_email;

        // Insert product
        const result = await db`
            INSERT INTO products (
                name, title, slug, category, primary_category, secondary_categories,
                brand, manufacturer, price, company_blurb, product_photos,
                youtube_link, technical_docs_url, target_audience, core_value_proposition,
                technical_specs, active_ingredients, ingredients, third_party_lab_link,
                excipients, warnings, certifications, allergens, dietary_tags,
                pillar_scores, sme_access_note, sme_signals, serving_size,
                servings_per_container, form, recommended_dosage, best_time_take,
                storage_instructions, serving_info, created_by,
                is_brand_verified, verification_status,
                created_at, updated_at
            ) VALUES (
                ${validated.name}, ${validated.name}, ${slug}, ${validated.category},
                ${validated.primary_category},
                ${JSON.stringify(validated.secondary_categories || { conditions: [], goals: [], ingredients: [], forms: [] })},
                ${validated.name.split(" ")[0]}, ${validated.manufacturer || null}, ${validated.price || null},
                ${validated.company_blurb}, ${validated.product_photos}, ${validated.youtube_link || null},
                ${validated.technical_docs_url || null}, ${validated.target_audience}, ${validated.core_value_proposition},
                ${JSON.stringify(validated.technical_specs)}, ${JSON.stringify(validated.active_ingredients || [])},
                ${ingredientsText}, ${validated.third_party_lab_link || null}, ${JSON.stringify(validated.excipients || [])},
                ${validated.warnings || null}, ${JSON.stringify(validated.certifications || [])},
                ${JSON.stringify(validated.allergens || [])}, ${JSON.stringify(validated.dietary_tags || [])},
                ${JSON.stringify(pillarScores)}, ${validated.sme_access_notes || null},
                ${JSON.stringify(validated.sme_signals || {})}, ${validated.serving_size || null},
                ${validated.servings_per_container || null}, ${validated.form || null},
                ${validated.recommended_dosage || null}, ${validated.best_time_take || null},
                ${validated.storage_instructions || null}, ${servingInfoCombined || null},
                ${user.id},
                false, 
                ${isBrandSubmission ? 'pending_payment' : 'pending'},
                NOW(), NOW()
            )
            RETURNING id
        `;

        const productId = result[0].id;

        // Insert benefits
        if (validated.benefits?.length) {
            for (const benefit of validated.benefits) {
                await db`
                    INSERT INTO product_benefits (
                        product_id, benefit_title, benefit_type, citation_url,
                        source_type, submitted_by, is_verified
                    ) VALUES (
                        ${productId}::uuid, ${benefit.title}, ${benefit.type},
                        ${benefit.citation || null}, 'official', ${user.id}, false
                    )
                `;
            }
        }

        // Handle Brand Verification Payment
        if (isBrandSubmission) {
            try {
                // Initialize brand verification record
                const verification = await db`
                    INSERT INTO brand_verification_requests (
                        user_id, product_id, work_email, linkedin_profile,
                        company_website, status, intention_statement
                    ) VALUES (
                        ${user.id}, ${productId}::uuid, ${validated.work_email},
                        ${validated.linkedin_profile}, ${validated.company_website},
                        'pending_payment', ${validated.company_blurb}
                    )
                    RETURNING id
                `;

                // Create Stripe Checkout Session
                const session = await createBrandSubscriptionCheckout({
                    userId: user.id,
                    userEmail: user.emailAddresses[0].emailAddress,
                    productId: productId,
                    verificationId: verification[0].id,
                    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products/${slug}?verified=true`,
                    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products/${slug}?verified=canceled`,
                });

                if (session?.url) {
                    return {
                        success: true,
                        productId,
                        slug,
                        checkoutUrl: session.url,
                        requiresPayment: true
                    };
                }
            } catch (stripeError) {
                console.error("Stripe Checkout Error:", stripeError);
                // Fallback to regular submission if Stripe fails, but warn user
                return {
                    success: true,
                    productId,
                    slug,
                    warning: "Product created but payment initialization failed. Please contact support."
                };
            }
        }

        revalidatePath("/products");
        revalidatePath("/admin/dashboard");

        return {
            success: true,
            productId,
            slug,
            requiresPayment: false,
        };
    } catch (error) {
        console.error("Product submission error:", error);
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
