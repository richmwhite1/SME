"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";

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

  const supabase = createClient();

  const { error } = await (supabase.from("protocols") as any)
    .update({ invite_sent: true })
    .eq("id", protocolId);

  if (error) {
    console.error("Error marking invite as sent:", error);
    throw new Error(`Failed to mark invite as sent: ${error.message}`);
  }

  revalidatePath("/admin");
  return { success: true };
}



