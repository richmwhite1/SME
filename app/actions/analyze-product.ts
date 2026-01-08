"use server";

import { getGemmaClient } from "@/lib/ai/gemma-client";

interface AnalyzedProductData {
    success: boolean;
    data?: any;
    error?: string;
}

export async function analyzeProductLabel(formData: FormData): Promise<AnalyzedProductData> {
    try {
        const file = formData.get("label") as File;
        if (!file) {
            throw new Error("No image provided");
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";

        const gemma = getGemmaClient();

        const prompt = `
      Analyze this product label image and extract the following information into a JSON object compatible with our database schema.
      
      Fields to extract:
      1. name: Product Name
      2. company_blurb: Brief description or marketing claims found on label
      3. active_ingredients: Array of { name, dosage } objects (e.g. { "name": "Vitamin C", "dosage": "500mg" })
      4. technical_specs: Record of other specs (e.g. { "Serving Size": "2 capsules", "Servings Per Container": "30" })
      5. benefits: Array of potential benefits mentioned (max 5), formatted as { "title": "Supports Immune Health", "type": "anecdotal", "citation": "" }
      6. target_audience: Inferred audience (e.g. "Adults", "Athletes")
      7. excipients: Array of other ingredients/fillers listed (e.g. "Magnesium Stearate", "Rice Flour")
      
      If a field is not found, leave it empty or null.
      Ensure strict JSON format.
    `;

        const result = await gemma.generateWithVision(prompt, base64, mimeType, {
            jsonMode: true,
            maxTokens: 2000,
            temperature: 0.1
        });

        // Parse JSON safely
        let jsonStr = result.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(jsonStr);

        return { success: true, data };
    } catch (error: any) {
        console.error("Error analyzing product label:", error);
        return { success: false, error: error.message };
    }
}

export async function analyzeProductUrl(url: string): Promise<AnalyzedProductData> {
    // Boilerplate for future URL analysis using similar logic but with text analysis
    // For now returning mock or error
    return { success: false, error: "URL analysis not yet implemented for Wizard path" };
}
