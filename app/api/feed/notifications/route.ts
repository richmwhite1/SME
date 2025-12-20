import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ hasNewDiscussions: false });

  const sql = getDb();
  try {
    // Get followed topics
    const follows = await sql`
      SELECT topic_name
      FROM topic_follows
      WHERE user_id = ${userId}
    `;
    
    const followedTopics = follows.map((f: any) => f.topic_name);
    
    if (followedTopics.length === 0) {
      return NextResponse.json({ hasNewDiscussions: false });
    }

    // Get last visit timestamp from query param (client will pass this)
    // For now, we'll check for discussions in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Get discussions created in the last 24 hours with matching tags
    const newDiscussions = await sql`
      SELECT id, tags
      FROM discussions
      WHERE created_at > ${oneDayAgo.toISOString()}
        AND (is_flagged IS FALSE OR is_flagged IS NULL)
        AND tags && ${sql.array(followedTopics)}
      LIMIT 50
    `;

    const hasNewDiscussions = newDiscussions.length > 0;
    
    return NextResponse.json({ hasNewDiscussions });
  } catch (error) {
    console.error('Error checking feed notifications:', error);
    return NextResponse.json({ hasNewDiscussions: false });
  }
}

