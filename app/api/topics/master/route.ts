import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';



export async function GET() {
  try {
    const sql = getDb();

    const topics = await sql`
      SELECT name, description, icon
      FROM topics
      ORDER BY name ASC
    `;

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching master topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master topics' },
      { status: 500 }
    );
  }
}






