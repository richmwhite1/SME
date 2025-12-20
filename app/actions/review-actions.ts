"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkUserBanned, checkKeywordBlacklist } from "@/lib/trust-safety";

export async function submitReview(
  protocolId: string,
  rating: number,
  content: string,
  protocolSlug?: string
) {
  // Auth check
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to submit a review");
  }

  // Check if user is banned
  const isBanned = await checkUserBanned(user.id);
  if (isBanned) {
    throw new Error("Your laboratory access has been restricted");
  }

  const sql = getDb();

  // Just-in-Time Sync: Ensure user exists in profiles table using UPSERT
  try {
    const profileData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      full_name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.emailAddresses[0]?.emailAddress || "User",
      avatar_url: user.imageUrl || null,
    };

    await sql`
      INSERT INTO profiles (id, email, full_name, avatar_url, healer_score)
      VALUES (
        ${profileData.id},
        ${profileData.email},
        ${profileData.full_name},
        ${profileData.avatar_url},
        0
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url
    `;
  } catch (error) {
    console.error("Error upserting profile:", error);
    throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check keyword blacklist (Revenue Guard)
  const trimmedContent = content.trim();
  const blacklistMatches = await checkKeywordBlacklist(trimmedContent);
  const shouldAutoFlag = blacklistMatches.length > 0;

  // Insert the review
  try {
    const insertedReviews = await sql`
      INSERT INTO reviews (
        protocol_id, user_id, rating, content, flag_count, is_flagged, helpful_count
      )
      VALUES (
        ${protocolId},
        ${user.id},
        ${rating},
        ${trimmedContent},
        ${shouldAutoFlag ? 1 : 0},
        ${shouldAutoFlag},
        0
      )
      RETURNING id
    `;

    if (!insertedReviews || insertedReviews.length === 0) {
      console.error("Review insert returned no data");
      throw new Error("Review was not created. Please try again.");
    }

    // If blacklisted keyword found, auto-flag and move to moderation queue
    if (shouldAutoFlag && blacklistMatches.length > 0) {
      console.log("Review auto-flagged due to blacklisted keyword:", blacklistMatches[0].keyword);
    }

  } catch (error) {
    console.error("Error inserting review:", error);
    throw new Error(`Failed to submit review: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Revalidate the product page (using ID for routing)
  if (protocolSlug) {
    revalidatePath(`/products/${protocolSlug}`, "page");
    revalidatePath(`/products/[id]`, "page");
  }
  // Always revalidate products list
  revalidatePath("/products", "page");
}
