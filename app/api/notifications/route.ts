import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json([], { status: 401 });

  const sql = getDb();
  try {
    // Fetches notifications with actor profile data
    const notifications = await sql`
      SELECT 
        n.id,
        n.actor_id,
        n.type,
        n.target_id,
        n.target_type,
        n.is_read,
        n.created_at,
        n.metadata,
        p.full_name as actor_name,
        p.username as actor_username,
        p.avatar_url as actor_avatar
      FROM notifications n
      LEFT JOIN profiles p ON n.actor_id = p.id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();
  try {
    const body = await request.json();
    
    if (body.mark_all) {
      // Mark all notifications as read for this user
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${userId} AND is_read = false
      `;
      return NextResponse.json({ success: true });
    } else if (body.id) {
      // Mark a specific notification as read
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE id = ${body.id} AND user_id = ${userId}
      `;
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}