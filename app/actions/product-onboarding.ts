"use server";

import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Define the signal type based on requirements
type SignalLens = "scientific" | "alternative" | "esoteric";

interface ProductSignal {
    signal: string; // The signal ID or name (e.g. "Lab Tested")
    lens_type: SignalLens;
    reason: string; // The justification text
}

// Data Map Type Definition
export type ProductSubmission = {
    name: string;
    brand: string;
    job_function: string; // Mapped from category
    founder_video_url?: string;
    ingredients?: string;
    citation_url?: string;
    coa_url?: string;
    lab_report_url?: string;
    // Phase 2 fields
    serving_size?: string;
    servings_per_container?: string;
    form?: string;
    recommended_dosage?: string;
    best_time_take?: string;
    storage_instructions?: string;
    // Phase 3 fields
    price?: string;
    manufacturer?: string;
    target_audience?: string;
    allergens?: string[];
    dietary_tags?: string[];
    excipients?: string[];
    warnings?: string;
    technical_docs_url?: string;
    certifications?: string[];
    signals: ProductSignal[];
};

// Zod Schema for validation
const ProductSchema = z.object({
    name: z.string().min(2, "Product name is required"),
    brand: z.string().min(2, "Brand name is required"),
    job_function: z.string().min(1, "Job function is required"),
    founder_video_url: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
    ingredients: z.string().optional(),
    citation_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    coa_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    lab_report_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    // Phase 2 fields
    serving_size: z.string().optional(),
    servings_per_container: z.string().optional(),
    form: z.string().optional(),
    recommended_dosage: z.string().optional(),
    best_time_take: z.string().optional(),
    storage_instructions: z.string().optional(),
    // Phase 3 fields
    price: z.string().optional(),
    manufacturer: z.string().optional(),
    target_audience: z.string().optional(),
    allergens: z.array(z.string()).optional(),
    dietary_tags: z.array(z.string()).optional(),
    excipients: z.array(z.string()).optional(),
    warnings: z.string().optional(),
    technical_docs_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    certifications: z.array(z.string()).optional(),
    signals: z.array(z.object({
        signal: z.string(),
        lens_type: z.enum(["scientific", "alternative", "esoteric"]),
        reason: z.string()
    })).min(1, "At least one truth signal is required")
});

export type FormState = {
    message: string;
    errors?: Record<string, string[]>;
    success: boolean;
};

export async function onboardProduct(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const user = await currentUser();

    if (!user) {
        return { success: false, message: "Unauthorized. Please sign in." };
    }

    // Parse signals from JSON string (if sent as serialized JSON)
    // OR extract from formData if sent differently. 
    // Given the wizard structure, passing a JSON string 'signals' is easiest.
    let parsedSignals: ProductSignal[] = [];
    try {
        const signalsJson = formData.get("signals") as string;
        if (signalsJson) {
            parsedSignals = JSON.parse(signalsJson);
        }
    } catch (e) {
        return { success: false, message: "Invalid signals data format" };
    }

    // Map FormData to object
    const rawData = {
        name: formData.get("name"),
        brand: formData.get("brand"),
        job_function: formData.get("category"), // input name is 'category' in current form
        founder_video_url: formData.get("founder_video_url"),
        ingredients: formData.get("ingredients"),
        citation_url: formData.get("citation_url"),
        coa_url: formData.get("coa_url"),
        lab_report_url: formData.get("lab_report_url"),
        // Phase 2 fields
        serving_size: formData.get("serving_size"),
        servings_per_container: formData.get("servings_per_container"),
        form: formData.get("form"),
        recommended_dosage: formData.get("recommended_dosage"),
        best_time_take: formData.get("best_time_take"),
        storage_instructions: formData.get("storage_instructions"),
        // Phase 3 fields (Parse comma-separated strings to arrays)
        price: formData.get("price"),
        manufacturer: formData.get("manufacturer"),
        target_audience: formData.get("target_audience"),
        allergens: (formData.get("allergens") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [],
        dietary_tags: (formData.get("dietary_tags") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [],
        excipients: (formData.get("excipients") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [],
        warnings: formData.get("warnings"),
        technical_docs_url: formData.get("technical_docs_url"),
        certifications: (formData.get("certifications") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [],
        signals: parsedSignals
    };

    // Validate
    const validation = ProductSchema.safeParse(rawData);

    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validation.error.flatten().fieldErrors
        };
    }

    const data = validation.data;
    const sql = getDb();

    try {
        // Generate slug
        const slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);

        // Execute all inserts sequentially
        // 1. Insert Product
        const [product] = await sql`
            INSERT INTO products (
                title, 
                brand, 
                category, 
                founder_video_url, 
                ingredients, 
                coa_url,
                lab_report_url,
                serving_size,
                servings_per_container,
                form,
                recommended_dosage,
                best_time_take,
                storage_instructions,
                price,
                manufacturer,
                target_audience,
                allergens,
                dietary_tags,
                excipients,
                warnings,
                technical_docs_url,
                certifications,
                admin_status,
                slug,
                created_by,
                problem_solved
            ) VALUES (
                ${data.name}, 
                ${data.brand}, 
                ${data.job_function}, 
                ${data.founder_video_url || null}, 
                ${data.ingredients || null}, 
                ${data.coa_url || null},
                ${data.lab_report_url || null},
                ${data.serving_size || null},
                ${data.servings_per_container || null},
                ${data.form || null},
                ${data.recommended_dosage || null},
                ${data.best_time_take || null},
                ${data.storage_instructions || null},
                ${data.price || null},
                ${data.manufacturer || null},
                ${data.target_audience || null},
                ${data.allergens || []},
                ${data.dietary_tags || []},
                ${data.excipients || []},
                ${data.warnings || null},
                ${data.technical_docs_url || null},
                ${data.certifications || []},
                'pending_review',
                ${slug},
                ${user.id},
                'Pending Review'
            )
            RETURNING id
        `;

        // 2. Insert Signals with separate reason field
        if (data.signals.length > 0) {
            // Prepare rows for insertion with reason in separate column
            const signalRows = data.signals.map(s => ({
                product_id: product.id,
                signal: s.signal,
                lens_type: s.lens_type,
                reason: s.reason
            }));

            await sql`
                INSERT INTO product_truth_signals ${sql(signalRows)}
            `;
        }

        revalidatePath("/products");
        return { success: true, message: "Product submitted successfully!" };
    } catch (error: any) {
        console.error("Error onboarding product:", error);
        return { success: false, message: "Failed to submit product. Please try again." };
    }
}
