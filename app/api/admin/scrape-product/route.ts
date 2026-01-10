import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { scrapeProductFromHTML } from '@/lib/ai/product-scraper';

/**
 * POST /api/admin/scrape-product
 * Admin-only endpoint to scrape product data from a URL
 */
export async function POST(request: NextRequest) {
    try {
        // Check admin access
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { productUrl } = body;

        // Validate URL
        if (!productUrl || typeof productUrl !== 'string') {
            return NextResponse.json(
                { error: 'Product URL is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        let url: URL;
        try {
            url = new URL(productUrl);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Fetch HTML content from URL
        let html: string;
        try {
            const response = await fetch(productUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; HealthSME-Scraper/1.0)',
                },
            });

            if (!response.ok) {
                return NextResponse.json(
                    { error: `Failed to fetch URL: ${response.statusText}` },
                    { status: 400 }
                );
            }

            html = await response.text();
        } catch (error) {
            console.error('Error fetching URL:', error);
            return NextResponse.json(
                { error: 'Failed to fetch product page. Please check the URL and try again.' },
                { status: 400 }
            );
        }

        // Scrape product data using AI
        const scrapeResult = await scrapeProductFromHTML(html, productUrl);

        if (!scrapeResult.success || !scrapeResult.data) {
            return NextResponse.json(
                { error: scrapeResult.error || 'Failed to extract product data' },
                { status: 400 }
            );
        }

        const productData = scrapeResult.data;

        // Check for duplicate by slug
        const sql = getDb();
        const existingProduct = await sql`
      SELECT id, title, slug, status
      FROM products
      WHERE slug = ${productData.slug}
      LIMIT 1
    `;

        if (existingProduct.length > 0) {
            const existing = existingProduct[0];
            return NextResponse.json(
                {
                    duplicate: true,
                    message: 'Product already exists',
                    existingProduct: {
                        id: existing.id,
                        title: existing.title,
                        slug: existing.slug,
                        status: existing.status,
                    },
                },
                { status: 200 }
            );
        }

        // Insert new product with status='unclaimed'
        const insertedProduct = await sql`
      INSERT INTO products (
        title,
        slug,
        description,
        ingredients,
        brand_name,
        status,
        reference_url
      ) VALUES (
        ${productData.name},
        ${productData.slug},
        ${productData.description},
        ${productData.ingredients ? JSON.stringify(productData.ingredients) : null}::jsonb,
        ${productData.brand_name},
        'unclaimed',
        ${productUrl}
      )
      RETURNING id, title, slug, status
    `;

        const newProduct = insertedProduct[0];

        return NextResponse.json(
            {
                success: true,
                message: 'Product scraped and added successfully',
                product: {
                    id: newProduct.id,
                    title: newProduct.title,
                    slug: newProduct.slug,
                    status: newProduct.status,
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error in scrape-product API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
