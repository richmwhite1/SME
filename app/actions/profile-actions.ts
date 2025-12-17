"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(
  fullName: string,
  username: string,
  bio: string,
  credentials: string,
  websiteUrl: string,
  socialLinks: {
    discord?: string | null;
    telegram?: string | null;
    x?: string | null;
    instagram?: string | null;
  }
) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to update your profile");
  }

  // Validate username format
  if (username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new Error(
        "Username must be 3-20 characters and contain only letters, numbers, dashes, and underscores"
      );
    }

    // Check if username is taken by another user
    const supabase = createClient();
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .neq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("Username is already taken");
    }
  }

  const supabase = createClient();

  const updateData = {
    full_name: fullName || null,
    username: username ? username.toLowerCase() : null,
    bio: bio || null,
    credentials: credentials || null,
    website_url: websiteUrl || null,
    social_links: socialLinks || {},
  };

  // @ts-ignore - Supabase types may not match exactly
  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/u", "page");

  return { success: true };
}

export async function toggleFollow(targetUserId: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to follow users");
  }

  if (user.id === targetUserId) {
    throw new Error("You cannot follow yourself");
  }

  const supabase = createClient();

  // Check if already following
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existingFollow) {
    // Unfollow
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("Error unfollowing:", error);
      throw new Error(`Failed to unfollow: ${error.message}`);
    }
  } else {
    // Follow
    const { error } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

    if (error) {
      console.error("Error following:", error);
      throw new Error(`Failed to follow: ${error.message}`);
    }
  }

  revalidatePath("/u", "page");

  return { success: true };
}

