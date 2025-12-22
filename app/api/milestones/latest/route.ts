import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();

    // Fetch the most recent displayed milestone
    const result = await sql`
      SELECT id, title, description, milestone_type, achieved_at
      FROM community_milestones
      WHERE is_displayed = true
      ORDER BY achieved_at DESC
      LIMIT 1
    `;

    if (result && result.length > 0) {
      return NextResponse.json({ milestone: result[0] });
    }

    return NextResponse.json({ milestone: null });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    );
  }
}






