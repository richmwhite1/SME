"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkVibe } from "@/lib/vibe-check";

/**
 * Create a comment on a product/protocol
 * Guest users require AI moderation, authenticated users bypass it
 */
export async function createProductComment(
  protocolId: string,
  content: string,
  protocolSlug: string
) {
  const user = await currentUser();
  const supabase = createClient();

  // Trim and validate content
  const trimmedContent = content.trim();
  if (trimmedContent.length < 3) {
    throw new Error("Comment must be at least 3 characters long");
  }

  if (trimmedContent.length > 2000) {
    throw new Error("Comment must be less than 2000 characters");
  }

  // Guest users require AI moderation
  if (!user) {
    const vibeResult = await checkVibe(trimmedContent);
    if (!vibeResult.isSafe) {
      throw new Error(`Content not allowed: ${vibeResult.reason}`);
    }
  } else {
    // Authenticated users bypass AI moderation (SME Freedom)
    console.log("Skipping AI moderation for authenticated user (SME freedom)");
  }

  // For authenticated users, insert comment
  if (user) {
    const { error } = await supabase
      .from("product_comments")
      .insert({
        protocol_id: protocolId,
        author_id: user.id,
        content: trimmedContent,
        flag_count: 0,
        is_flagged: false,
      } as any);

    if (error) {
      console.error("Error creating comment:", error);
      // Check if table doesn't exist
      if (error.message?.includes("does not exist") || error.message?.includes("schema")) {
        throw new Error(
          "Product comments table not found. Please run the SQL migration: supabase-product-comments.sql in your Supabase SQL Editor."
        );
      }
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  } else {
    // Guest comments not supported for products (only authenticated users)
    throw new Error("You must be logged in to comment on products");
  }

  revalidatePath(`/products/${protocolSlug}`);
  revalidatePath("/products");

  return { success: true };
}

