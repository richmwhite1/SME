import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    const topics = await sql`
      SELECT id, name, slug, description 
      FROM topics 
      ORDER BY name ASC
    `;
    return NextResponse.json(topics);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}