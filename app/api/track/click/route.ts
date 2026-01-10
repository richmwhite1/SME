import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const productId = searchParams.get('id');

    if (!slug && !productId) {
        return NextResponse.json({ error: "Missing product slug or id" }, { status: 400 });
    }

    const db = getDb();

    try {
        // 1. Find Product & Buy URL
        let product;
        if (productId) {
            const result = await db`SELECT id, buy_url FROM products WHERE id = ${productId}`;
            product = result[0];
        } else if (slug) {
            const result = await db`SELECT id, buy_url FROM products WHERE slug = ${slug}`;
            product = result[0];
        }

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (!product.buy_url) {
            return NextResponse.json({ error: "No buy URL for this product" }, { status: 400 });
        }

        // 2. Track Click (Async - don't block redirect)
        // Hash IP/UserAgent for basic uniqueness without PII storage
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const ua = request.headers.get('user-agent') || 'unknown';
        const visitorId = crypto.createHash('sha256').update(ip + ua).digest('hex');

        await db`
            INSERT INTO product_events (product_id, event_type, visitor_id, metadata)
            VALUES (
                ${product.id}, 
                'click', 
                ${visitorId}, 
                ${JSON.stringify({ referer: request.headers.get('referer') })}
            )
        `;

        // 3. Redirect
        return NextResponse.redirect(product.buy_url);

    } catch (error) {
        console.error("Error tracking click:", error);
        // Fallback: Try to redirect anyway if we have the URL, otherwise error
        // But since we might not have product object if DB failed, standard error
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
