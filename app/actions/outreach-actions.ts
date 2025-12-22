"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

/**
 * Mark an invite as sent for a product
 */
export async function markInviteSent(protocolId: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Unauthorized: Admin access required");
  }

  const sql = getDb();

  const result = await sql`
    UPDATE products
    SET invite_sent = true, updated_at = NOW()
    WHERE id = ${protocolId}
    RETURNING id
  `;

  if (!result || result.length === 0) {
    throw new Error("Failed to mark invite as sent: Protocol not found");
  }

  revalidatePath("/admin");
  return { success: true };
}



