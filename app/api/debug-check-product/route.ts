import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();
    try {
        const products = await sql`
        SELECT id, title, slug, admin_status, insight_trigger_upvote_threshold 
        FROM products 
        WHERE title = 'Debug Product'
        ORDER BY created_at DESC
        LIMIT 1;
    `;
        return NextResponse.json({ success: true, product: products[0] || null });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
