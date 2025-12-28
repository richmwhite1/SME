"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function updateLastActive() {
    const user = await currentUser();
    if (!user) return; // Silent fail

    const sql = getDb();
    await sql`
    UPDATE profiles 
    SET last_active_at = NOW()
    WHERE id = ${user.id}
  `;
}

export async function getUnreadMessageCount() {
    const user = await currentUser();
    if (!user) return 0;

    const sql = getDb();
    const res = await sql`
    SELECT count(*) as count 
    FROM messages 
    WHERE recipient_id = ${user.id} AND is_read = false
  `;

    return parseInt(res[0].count);
}
