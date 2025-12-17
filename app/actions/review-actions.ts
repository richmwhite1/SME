"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const supabase = createClient();

  // Just-in-Time Sync: Check if user exists in profiles table
  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // If user doesn't exist, create them using upsert (safer - handles race conditions)
  if (!existingProfile && !checkError) {
    const profileData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      full_name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.emailAddresses[0]?.emailAddress || "User",
      avatar_url: user.imageUrl || null,
      healer_score: 0, // Start with 0, will be calculated based on helpful votes
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData as any, {
        onConflict: "id",
      });

    if (profileError) {
      console.error("Error creating/updating profile:", profileError);
      console.error("Profile data attempted:", profileData);
      throw new Error(
        `Failed to create user profile: ${profileError.message || "Unknown error"}`
      );
    }
  } else if (checkError) {
    // If there's an error checking, log it but try to continue (might be a permissions issue)
    console.warn("Error checking for existing profile:", checkError);
    // Try to upsert anyway - upsert is idempotent
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          full_name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.emailAddresses[0]?.emailAddress || "User",
          avatar_url: user.imageUrl || null,
          healer_score: 0,
        } as any,
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error("Error upserting profile:", profileError);
      throw new Error(
        `Failed to create user profile: ${profileError.message || "Unknown error"}`
      );
    }
  }

  // Insert the review
  const { error: reviewError } = await supabase
    .from("reviews")
    .insert({
      protocol_id: protocolId,
      user_id: user.id,
      rating: rating,
      content: content.trim(),
      flag_count: 0,
      is_flagged: false,
      helpful_count: 0,
    } as any);

  if (reviewError) {
    console.error("Error inserting review:", reviewError);
    throw new Error(
      `Failed to submit review: ${reviewError.message || "Unknown error"}`
    );
  }

  // Revalidate the product page
  if (protocolSlug) {
    revalidatePath(`/products/${protocolSlug}`, "page");
    // Also revalidate by ID pattern in case it's accessed that way
    revalidatePath(`/products/[slug]`, "page");
  } else {
    // Fallback: revalidate all product pages
    revalidatePath("/products", "page");
  }
}

