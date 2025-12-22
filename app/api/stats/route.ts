import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();

    // Count verified products (SME certified) - checking protocols table
    let certifiedCount = 0;
    try {
      const certifiedResult = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM products
        WHERE is_sme_certified = true
      `;
      certifiedCount = certifiedResult[0]?.count || 0;
    } catch (err) {
      // Table might not exist yet, ignore
      console.warn('Protocols table access failed in stats:', err);
    }

    // Count reviewed products (not flagged)
    let reviewedCount = 0;
    try {
      const reviewedResult = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM reviews
        WHERE is_flagged = false OR is_flagged IS NULL
      `;
      reviewedCount = reviewedResult[0]?.count || 0;
    } catch (err) {
      // Table might not exist yet, ignore
      console.warn('Reviews table access failed in stats:', err);
    }

    // Use certified count as primary, fallback to reviewed count
    const count = certifiedCount || reviewedCount || 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Return default object to prevent UI crash
    return NextResponse.json({ count: 0 });
  }
}






