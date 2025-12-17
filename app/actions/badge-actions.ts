"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();

  // Call the RPC function to update badge
  const { error } = await supabase.rpc("update_user_badge", {
    user_id_param: user.id,
  } as any);

  if (error) {
    console.error("Error updating badge:", error);
    throw new Error(`Failed to update badge: ${error.message}`);
  }

  // Revalidate profile pages
  revalidatePath("/u", "page");
  revalidatePath("/settings", "page");

  return { success: true };
}


