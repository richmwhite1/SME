'use client'; // This will be called from client components
import { getDb } from '@/lib/db';

export async function getNotifications(userId: string) {
  const sql = getDb();
  
  try {
    // Raw SQL to fetch notifications for the specific SME
    const notifications = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}