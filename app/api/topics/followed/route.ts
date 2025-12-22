import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sql = getDb();

    const follows = await sql`
      SELECT topic_name
      FROM topic_follows
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    const topics = follows.map((f: { topic_name: string }) => f.topic_name);

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching followed topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followed topics' },
      { status: 500 }
    );
  }
}






