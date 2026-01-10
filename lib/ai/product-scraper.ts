import { getGemmaClient } from './gemma-client';
import { extractTextFromHTML, generateSlug } from '../html-to-text';

/**
 * Product Scraper Service
 * Uses Gemini AI to extract structured product data from HTML content
 */

export interface ScrapedProductData {
    name: string;
    description: string;
    ingredients: string[] | null;
    brand_name: string;
    slug: string;
}

export interface ScrapeResult {
    success: boolean;
    data?: ScrapedProductData;
    error?: string;
}

/**
 * Scrape product information from HTML content using AI
 */
export async function scrapeProductFromHTML(html: string, sourceUrl: string): Promise<ScrapeResult> {
    try {
        // Extract clean text from HTML
        const cleanText = extractTextFromHTML(html);

        if (!cleanText || cleanText.length < 50) {
            return {
                success: false,
                error: 'Insufficient text content extracted from URL. Please ensure the URL points to a valid product page.',
            };
        }

        // Truncate text to avoid token limits (keep first 8000 chars)
        const textToAnalyze = cleanText.substring(0, 8000);

        // Craft AI prompt for product extraction
        const prompt = `You are a product data extraction assistant. Analyze the following text from a product webpage and extract structured product information.

Source URL: ${sourceUrl}

Product Page Text:
${textToAnalyze}

Extract the following information and return ONLY valid JSON:
{
  "name": "Product name (string, required)",
  "description": "Brief product description (string, 1-3 sentences)",
  "ingredients": ["ingredient1", "ingredient2"] or null if not found,
  "brand_name": "Brand or manufacturer name (string)"
}

Rules:
- If you cannot find a field, use a reasonable default or null for ingredients
- Keep description concise (under 300 characters)
- Extract only active ingredients if it's a supplement
- Brand name should be the manufacturer, not the product name
- Return ONLY the JSON object, no additional text

JSON Response:`;

        const gemmaClient = getGemmaClient();

        // Generate with JSON mode
        const response = await gemmaClient.generateText(undefined, prompt, {
            temperature: 0.2,
            maxTokens: 800,
            jsonMode: true,
        });

        // Parse JSON response
        let jsonStr = response.trim();

        // Clean up potential markdown code blocks
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        // Extract JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr);

        // Validate required fields
        if (!parsed.name || typeof parsed.name !== 'string') {
            return {
                success: false,
                error: 'Could not extract product name from the page. Please verify the URL points to a product page.',
            };
        }

        // Generate slug from product name
        const slug = generateSlug(parsed.name);

        if (!slug) {
            return {
                success: false,
                error: 'Could not generate valid slug from product name.',
            };
        }

        // Build result
        const productData: ScrapedProductData = {
            name: parsed.name.trim(),
            description: parsed.description?.trim() || 'No description available',
            ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : null,
            brand_name: parsed.brand_name?.trim() || 'Unknown Brand',
            slug,
        };

        return {
            success: true,
            data: productData,
        };

    } catch (error) {
        console.error('Error scraping product:', error);

        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: 'Failed to parse AI response. The product page may have unusual formatting.',
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred during scraping',
        };
    }
}
