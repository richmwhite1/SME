"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

/**
 * Manually trigger badge update for the current user
 * Only available to admins for testing purposes
 */
export async function updateBadgeManually() {
  const user = await currentUser();
  
  if (!user) {
    throw new Error("You must be logged in");
  }

  // Check if user is admin
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only admins can manually update badges");
  }

  const sql = getDb();

  try {
    // Call the stored procedure to update badge
    await sql`SELECT update_user_badge(${user.id})`;
  } catch (error) {
    console.error("Error updating badge:", error);
    throw new Error(`Failed to update badge: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Revalidate profile pages
  revalidatePath("/u", "page");
  revalidatePath("/settings", "page");

  return { success: true };
}
