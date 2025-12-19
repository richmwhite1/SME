"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(
  fullName: string,
  username: string,
  bio: string,
  credentials: string,
  profession: string,
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

  const sql = getDb();

  // Validate username format
  if (username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new Error(
        "Username must be 3-20 characters and contain only letters, numbers, dashes, and underscores"
      );
    }

    // Check if username is taken by another user
    const existingProfileResult = await sql`
      SELECT id
      FROM profiles
      WHERE username = ${username.toLowerCase()}
        AND id != ${user.id}
      LIMIT 1
    `;

    if (existingProfileResult.length > 0) {
      throw new Error("Username is already taken");
    }
  }

  // Save social handles to Clerk publicMetadata for site-wide persistence
  try {
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        xHandle: socialLinks.x || null,
        telegramHandle: socialLinks.telegram || null,
        discordHandle: socialLinks.discord || null,
        instagramHandle: socialLinks.instagram || null,
      },
    });
  } catch (metadataError) {
    console.error("Error updating Clerk metadata:", metadataError);
    // Don't fail the whole operation if metadata update fails
  }

  try {
    // Update profile using raw SQL
    await sql`
      UPDATE profiles
      SET full_name = ${fullName || null},
          username = ${username ? username.toLowerCase() : null},
          bio = ${bio || null},
          credentials = ${credentials || null},
          profession = ${profession || null},
          website_url = ${websiteUrl || null},
          social_links = ${sql.json(socialLinks || {})}
      WHERE id = ${user.id}
    `;

    revalidatePath("/settings");
    revalidatePath("/u", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function toggleFollow(targetUserId: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to follow users");
  }

  if (user.id === targetUserId) {
    throw new Error("You cannot follow yourself");
  }

  const sql = getDb();

  try {
    // Check if already following
    const existingFollowResult = await sql`
      SELECT id
      FROM follows
      WHERE follower_id = ${user.id}
        AND following_id = ${targetUserId}
      LIMIT 1
    `;

    if (existingFollowResult.length > 0) {
      // Unfollow
      await sql`
        DELETE FROM follows
        WHERE follower_id = ${user.id}
          AND following_id = ${targetUserId}
      `;
    } else {
      // Follow
      await sql`
        INSERT INTO follows (follower_id, following_id)
        VALUES (${user.id}, ${targetUserId})
      `;
    }

    revalidatePath("/u", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    throw new Error(error.message || "Failed to toggle follow");
  }
}

export async function updateSocialHandles(
  xHandle: string | null,
  telegramHandle: string | null
) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to update social handles");
  }

  try {
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        xHandle: xHandle || null,
        telegramHandle: telegramHandle || null,
      },
    });
  } catch (error) {
    console.error("Error updating Clerk metadata:", error);
    throw new Error(`Failed to update social handles: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  revalidatePath("/u", "page");
  revalidatePath("/settings");

  return { success: true };
}

