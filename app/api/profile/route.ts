import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();
  try {
    const profile = await sql`
      SELECT 
        id,
        full_name,
        username,
        email,
        avatar_url,
        bio,
        website_url,
        credentials,
        contributor_score,
        reputation_score,
        is_verified_expert,
        is_sme,
        is_admin,
        badge_type,
        created_at,
        updated_at
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

    return NextResponse.json(profile[0] || null);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

