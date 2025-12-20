import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, discussion_id, author_id } = await request.json();

    // Validation
    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (!discussion_id) {
      return NextResponse.json(
        { message: 'Discussion ID is required' },
        { status: 400 }
      );
    }

    if (!author_id) {
      return NextResponse.json(
        { message: 'Author ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Insert the comment using raw SQL
    const result = await sql`
      INSERT INTO discussion_comments (content, discussion_id, author_id, created_at, updated_at)
      VALUES (${content.trim()}, ${discussion_id}, ${author_id}, NOW(), NOW())
      RETURNING id, content, discussion_id, author_id, created_at, updated_at
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { message: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating discussion comment:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Failed to create comment'
      },
      { status: 500 }
    );
  }
}
