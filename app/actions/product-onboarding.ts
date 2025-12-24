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

        await sql.begin(async (sql) => {
            // 1. Insert Product
            const [product] = await sql`
                INSERT INTO products (
                    title, 
                    brand, 
                    category, 
                    founder_video_url, 
                    ingredients, 
                    citation_url, 
                    coa_url, 
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
                    ${data.lab_report_url || data.citation_url || null},
                    ${data.coa_url || null},
                    'pending_review',
                    ${slug},
                    ${user.id},
                    'Pending Review'
                )
                RETURNING id
            `;

            // 2. Insert Signals if any
            if (data.signals.length > 0) {
                // Prepare rows for insertion
                const signalRows = data.signals.map(s => ({
                    product_id: product.id,
                    signal: `${s.signal}: ${s.reason}`,
                    lens_type: s.lens_type
                }));

                await sql`
                    INSERT INTO product_truth_signals ${sql(signalRows)}
                `;
            }
        });

        revalidatePath("/products");
        return { success: true, message: "Product submitted successfully!" };
    } catch (error: any) {
        console.error("Error onboarding product:", error);
        return { success: false, message: "Failed to submit product. Please try again." };
    }
}
