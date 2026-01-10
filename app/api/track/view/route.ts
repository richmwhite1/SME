import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slug, productId } = body;

        if (!slug && !productId) {
            return NextResponse.json({ error: "Missing product slug or id" }, { status: 400 });
        }

        const db = getDb();

        // 1. Get Product ID if only slug provided
        let targetId = productId;
        if (!targetId && slug) {
            const result = await db`SELECT id FROM products WHERE slug = ${slug}`;
            if (result.length > 0) {
                targetId = result[0].id;
            }
        }

        if (!targetId) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // 2. Track View
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const ua = request.headers.get('user-agent') || 'unknown';
        const visitorId = crypto.createHash('sha256').update(ip + ua).digest('hex');

        // Check for recent view from same visitor to deduplicate (e.g. within 1 hour)
        // Simplified: Just insert, we can aggregte later. Or use specific "session" logic.
        // For billing, we count unique visitors? Or just raw views? usage-based usually counts raw or unique per day.
        // Let's just insert for now.

        await db`
            INSERT INTO product_events (product_id, event_type, visitor_id)
            VALUES (${targetId}, 'view', ${visitorId})
        `;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error tracking view:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
