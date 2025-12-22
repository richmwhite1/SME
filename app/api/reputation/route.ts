import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ score: 0 });

  const sql = getDb();
  try {
    // Fetches the user's community standing score
    const result = await sql`
      SELECT score FROM profiles WHERE user_id = ${userId} LIMIT 1
    `;
    return NextResponse.json(result[0] || { score: 0 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch reputation' }, { status: 500 });
  }
}