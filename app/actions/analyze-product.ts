"use server";

import { getGemmaClient } from "@/lib/ai/gemma-client";
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

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
            Analyze this product label image deeply.
            CRITICAL: Look for a "Supplement Facts" or "Nutrition Facts" panel. If found, extract every single row from it into 'active_ingredients'.
      
            Fields to extract:
            1. name: Product Name (Distinguish from the Brand Name which is usually a logo. E.g. Brand = "Thorne", Product = "Magnesium Bisglycinate")
            2. company_blurb: Brief description or marketing claims found on label
            3. active_ingredients: Array of { name, dosage } objects from the Facts panel (e.g. { "name": "Vitamin C", "dosage": "500mg" }). Include *all* listed ingredients.
            4. technical_specs: Record of other specs. MUST include "Serving Size", "Servings Per Container", "Directions", and "Storage Instructions" if found.
            5. benefits: Array of potential benefits mentioned (max 5), formatted as { "title": "Supports Immune Health", "type": "anecdotal", "citation": "" }
            6. target_audience: Inferred audience (e.g. "Adults", "Athletes")
            7. excipients: Array of "Other Ingredients" or fillers listed (e.g. "Magnesium Stearate", "Rice Flour")
      
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



// ... (existing helper logic)

export async function analyzeProductUrl(url: string): Promise<AnalyzedProductData> {
    try {
        if (!url) throw new Error("No URL provided");

        // 1. Fetch HTML
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
        const html = await res.text();

        // 2. Extract content
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            throw new Error("Could not extract main content from URL");
        }

        const content = article.textContent.substring(0, 50000); // Limit context

        // 3. AI Analysis
        const gemma = getGemmaClient();
        const prompt = `
          Analyze this product page text and extract the following information into a JSON object compatible with our database schema.
          
          Product Page Content:
          "${content}"
          
          Fields to extract:
          1. name: Product Name
          2. company_blurb: Brief description or marketing claims
          3. active_ingredients: Array of { name, dosage } objects
          4. technical_specs: Record of other specs
          5. benefits: Array of potential benefits mentioned (max 5), formatted as { "title": "Supports Immune Health", "type": "anecdotal", "citation": "" }
          6. target_audience: Inferred audience
          7. excipients: Array of other ingredients/fillers
          
          If a field is not found, leave it empty or null.
          Ensure strict JSON format.
        `;

        const result = await gemma.generateText('gemini-2.0-flash', prompt, {
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
        console.error("Error analyzing product URL:", error);
        return { success: false, error: error.message };
    }
}

export async function lookupProductByBarcode(barcode: string): Promise<AnalyzedProductData> {
    try {
        if (!barcode) throw new Error("No barcode provided");

        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
            headers: { 'User-Agent': 'SME-Health-App/1.0 (sme.health)' }
        });

        if (!res.ok) throw new Error(`OpenFoodFacts API Error: ${res.statusText}`);

        const json = await res.json();
        if (json.status === 0 || !json.product) {
            return { success: false, error: "Product not found in OpenFoodFacts database" };
        }

        const p = json.product;

        // Map OpenFoodFacts data to WizardFormValues
        const data: any = {
            name: p.product_name || "",
            company_blurb: p.brands ? `Brand: ${p.brands}.` : "",
            active_ingredients: [], // OFF doesn't give neat dosage arrays easily, usually just text
            technical_specs: [],
            product_photos: [],
            excipients: []
        };

        // Try to parse ingredients if available
        if (p.ingredients_text) {
            data.company_blurb += ` Ingredients: ${p.ingredients_text.substring(0, 200)}...`;
        }

        // Nutriments -> Technical Specs
        if (p.nutriments) {
            const specs = [];
            if (p.serving_size) specs.push({ key: "Serving Size", value: p.serving_size });
            if (p.nutriments.energy_value) specs.push({ key: "Energy", value: `${p.nutriments.energy_value} ${p.nutriments.energy_unit}` });
            if (p.nutriments.proteins_100g) specs.push({ key: "Proteins (100g)", value: `${p.nutriments.proteins_100g}g` });
            if (p.nutriments.carbohydrates_100g) specs.push({ key: "Carbs (100g)", value: `${p.nutriments.carbohydrates_100g}g` });

            data.technical_specs = specs;
        }

        // Image
        if (p.image_url) {
            data.product_photos = [p.image_url];
        }

        return { success: true, data };

    } catch (error: any) {
        console.error("Error looking up barcode:", error);
        return { success: false, error: error.message };
    }
}
