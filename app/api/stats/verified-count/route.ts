import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sql = getDb();

        // Count verified products (SME certified)
        const certifiedResult = await sql`
      SELECT COUNT(*)::INTEGER as count
      FROM products
      WHERE is_sme_certified = true
    `;

        // Count reviewed products
        const reviewedResult = await sql`
      SELECT COUNT(*)::INTEGER as count
      FROM reviews
    `;

        const certifiedCount = certifiedResult[0]?.count || 0;
        const reviewedCount = reviewedResult[0]?.count || 0;

        // Use certified count as primary, fallback to reviewed count
        const count = certifiedCount || reviewedCount || 0;

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Error fetching verified count:', error);
        return NextResponse.json(
            { error: 'Failed to fetch verified count', count: 0 },
            { status: 500 }
        );
    }
}
