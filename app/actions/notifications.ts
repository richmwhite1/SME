"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNotifications(userId: string) {
  const sql = getDb();

  try {
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

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  link?: string
) {
  const sql = getDb();

  try {
    await sql`
            INSERT INTO notifications (user_id, title, message, type, link, is_read)
            VALUES (${userId}, ${title}, ${message}, ${type}, ${link || null}, false)
        `;
    // No revalidatePath needed here usually as notifications are user-specific and fetched on demand/poll
    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const sql = getDb();
  try {
    await sql`
            UPDATE notifications
            SET is_read = true
            WHERE id = ${notificationId}
        `;
    revalidatePath("/notifications"); // If there was a notifications page
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}