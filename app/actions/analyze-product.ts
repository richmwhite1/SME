"use server";

import { getGeminiClient } from "@/lib/ai/gemini-client";
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

        const gemini = getGeminiClient();

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
            8. allergens: Array of allergens from ["dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy", "gluten", "none"]. Look for "Contains:" or "Allergen Warning:" sections. If no allergens found, use ["none"].
            9. dietary_tags: Array of dietary compliance tags from ["vegan", "vegetarian", "gluten_free", "dairy_free", "kosher", "halal", "paleo", "keto", "non_gmo"]. Look for certification badges or claims.
      
            If a field is not found, leave it empty or null.
            Ensure strict JSON format.
        `;

        const result = await gemini.generateWithVision(prompt, base64, mimeType, {
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
    let browser;
    try {
        if (!url) throw new Error("No URL provided");

        // Dynamic import of Puppeteer (server-side only)
        const puppeteer = await import('puppeteer');

        // 1. Launch headless browser
        browser = await puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 2. Navigate to URL with timeout
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 15000
        });

        // 3. Click common tab/accordion selectors to reveal hidden content
        const clickSelectors = [
            'button:has-text("Ingredients")',
            'button:has-text("Supplement Facts")',
            'button:has-text("Nutrition Facts")',
            '[data-tab="ingredients"]',
            '[data-accordion="ingredients"]',
            '.ingredients-tab',
            '.supplement-facts-tab',
            'a[href*="ingredients"]',
            'button[aria-label*="ingredients"]',
            'div:has-text("Ingredients"):visible',
            'button:has-text("Details")',
            'button:has-text("More Info")'
        ];

        for (const selector of clickSelectors) {
            try {
                // Try to click if element exists (non-blocking)
                await page.click(selector, { timeout: 500 });
                await page.waitForTimeout(500); // Wait for content to load
            } catch (e) {
                // Element not found or not clickable, continue
            }
        }

        // 4. Extract images
        const images = await page.evaluate((pageUrl) => {
            const imgs: string[] = [];

            // Open Graph image
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) {
                const content = ogImage.getAttribute('content');
                if (content) imgs.push(content);
            }

            // Product images (common selectors)
            const selectors = [
                'img[data-product-image]',
                '.product-image img',
                '#product-image',
                '[itemprop="image"]',
                '.product-gallery img',
                '[data-testid="product-image"]',
                'img[alt*="product" i]',
                '.product-photos img',
                '[data-role="product-image"]'
            ];

            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(img => {
                    const src = img.getAttribute('src') || img.getAttribute('data-src');
                    if (src && !src.includes('placeholder') && !src.includes('loading')) {
                        try {
                            const fullUrl = new URL(src, pageUrl).href;
                            imgs.push(fullUrl);
                        } catch (e) {
                            // Invalid URL, skip
                        }
                    }
                });
            });

            return [...new Set(imgs)].slice(0, 5);
        }, url);

        // 5. Extract full text content (after JavaScript execution)
        const content = await page.evaluate(() => {
            // Remove script, style, and nav elements
            const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, .cookie-banner, .popup');
            elementsToRemove.forEach(el => el.remove());

            return document.body.innerText || document.body.textContent || '';
        });

        await browser.close();
        browser = undefined;

        if (!content || content.trim().length < 100) {
            throw new Error("Could not extract sufficient content from URL");
        }

        const limitedContent = content.substring(0, 50000); // Limit context for Gemini

        // 6. Enhanced AI Analysis with Gemini Flash
        const gemini = getGeminiClient();
        const prompt = `
You are analyzing a health/supplement product page. Extract comprehensive product information.

Product Page Content:
"${limitedContent}"

Extract the following fields into a strict JSON object:

REQUIRED FIELDS:
- name: Product name (NOT the brand name - e.g., "Magnesium Bisglycinate" not "Thorne")
- company_blurb: Company mission or about section (NOT medical disclaimers or warnings)
- manufacturer: Brand or company name

PRODUCT DETAILS:
- price: Retail price if mentioned (e.g., "$29.99" or "29.99")
- serving_info: Serving size and servings per container (e.g., "2 capsules, 60 servings")
- core_value_proposition: Main benefit or promise (e.g., "Supports healthy sleep patterns")
- target_audience: Intended users (e.g., "Adults seeking better sleep")

INGREDIENTS (CRITICAL for supplements):
- active_ingredients: Array of {name, dosage} objects
  * dosage is OPTIONAL - only include if clearly stated
  * Extract ALL listed active ingredients from Supplement Facts or Nutrition Facts panel
  * Example: [{"name": "Magnesium", "dosage": "200mg"}, {"name": "Vitamin D3", "dosage": ""}]
- excipients: Array of other ingredients/fillers (e.g., ["Hypromellose", "Rice Flour"])

BENEFITS:
- benefits: Array of benefit objects (max 5)
  * Format: [{"title": "Supports Immune Health", "type": "anecdotal", "citation": ""}]
  * Extract marketing claims as benefits
  * ALWAYS set type to "anecdotal"
  * Leave citation empty

SAFETY & QUALITY:
- warnings: Any warnings, contraindications, or "consult physician" notes
- certifications: Array of third-party certifications mentioned (e.g., ["NSF Certified", "GMP", "Organic"])
- allergens: Array of allergens from ["dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy", "gluten", "none"]
  * Look for "Contains:", "Allergen Warning:", or "Allergen Information:" sections
  * If no allergens are mentioned, use ["none"]
  * Example: ["dairy", "soy"] or ["none"]
- dietary_tags: Array of dietary compliance tags from ["vegan", "vegetarian", "gluten_free", "dairy_free", "kosher", "halal", "paleo", "keto", "non_gmo"]
  * Look for certification badges, seals, or explicit claims (e.g., "Certified Vegan", "Gluten-Free", "Non-GMO Project Verified")
  * Only include tags that are explicitly stated or certified
  * Example: ["vegan", "gluten_free", "non_gmo"]

TECHNICAL SPECS:
- technical_specs: Array of {key, value} objects for other details
  * Include: dosage form, storage instructions, allergen info, etc.
  * Example: [{"key": "Form", "value": "Capsules"}, {"key": "Storage", "value": "Cool, dry place"}]

IMPORTANT RULES:
1. If a field is not found, use empty string "" or empty array []
2. Do NOT include medical disclaimers in company_blurb
3. Distinguish between brand name and product name
4. Ingredient dosage is optional - extract only if available
5. All benefits should have type "anecdotal"
6. For allergens: if no allergens are mentioned, use ["none"]
7. For dietary_tags: only include tags that are explicitly stated or certified
8. Return ONLY valid JSON, no markdown formatting

Return the JSON object now:
        `;

        const result = await gemini.generateText('gemini-2.0-flash', prompt, {
            jsonMode: true,
            maxTokens: 3000,
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

        // Add extracted images to the data
        if (images.length > 0) {
            data.product_photos = images;
        }

        return { success: true, data };

    } catch (error: any) {
        console.error("Error analyzing product URL:", error);

        // Ensure browser is closed on error
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                // Ignore close errors
            }
        }

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
