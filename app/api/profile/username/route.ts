import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const result = await sql`
      SELECT username
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (result && result.length > 0) {
      return NextResponse.json({ username: result[0].username });
    }

    return NextResponse.json(
      { username: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching username:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to fetch username',
      },
      { status: 500 }
    );
  }
}
