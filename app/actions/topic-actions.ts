"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Toggle following a topic
 * Adds the topic to topic_follows if not following, removes if already following
 */
export async function toggleTopicFollow(topicName: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to follow topics");
  }

  const sql = getDb();

  try {
    // Just-in-Time Profile Sync: Ensure user exists in profiles table
    const existingProfileResult = await sql`
      SELECT id
      FROM profiles
      WHERE id = ${user.id}
    `;

    // If user doesn't exist, create them using upsert
    if (existingProfileResult.length === 0) {
      const fullName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.emailAddresses[0]?.emailAddress || "User";

      await sql`
        INSERT INTO profiles (id, email, full_name, avatar_url, contributor_score)
        VALUES (
          ${user.id},
          ${user.emailAddresses[0]?.emailAddress || ""},
          ${fullName},
          ${user.imageUrl || null},
          0
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url
      `;
    }

    // Normalize topic name (trim for consistency)
    const normalizedTopic = topicName.trim();

    if (!normalizedTopic) {
      throw new Error("Topic name cannot be empty");
    }

    // Check if user is already following this topic
    const existingFollowResult = await sql`
      SELECT id
      FROM topic_follows
      WHERE user_id = ${user.id}
        AND topic_name = ${normalizedTopic}
    `;

    if (existingFollowResult.length > 0) {
      // Unfollow: Delete the follow record
      await sql`
        DELETE FROM topic_follows
        WHERE id = ${existingFollowResult[0].id}
      `;

      revalidatePath("/feed", "page");
      revalidatePath("/discussions", "page");
      revalidatePath("/topics", "page");
      revalidatePath("/topic", "page");
      return { success: true, following: false };
    } else {
      // Follow: Insert new follow record
      const result = await sql`
        INSERT INTO topic_follows (user_id, topic_name)
        VALUES (${user.id}, ${normalizedTopic})
        RETURNING id
      `;

      if (!result[0]) {
        console.error("Topic follow insert returned no data");
        throw new Error("Topic follow was not created. Please try again.");
      }

      console.log("Topic follow successfully created:", result[0].id);

      revalidatePath("/feed", "page");
      revalidatePath("/discussions", "page");
      revalidatePath("/topics", "page");
      revalidatePath("/topic", "page");
      return { success: true, following: true };
    }
  } catch (error: any) {
    console.error("Error in toggleTopicFollow:", error);
    
    // Provide more specific error messages for common issues
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      throw new Error(
        `Database permission error: Row Level Security (RLS) is enabled on topic_follows table. ` +
        `Please disable RLS for this table.`
      );
    }
    
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      throw new Error(
        `Foreign key constraint error: User profile not found. Please try again.`
      );
    }
    
    throw new Error(error.message || "Failed to toggle topic follow");
  }
}

/**
 * Get all topics the current user is following
 */
export async function getFollowedTopics(): Promise<string[]> {
  const user = await currentUser();

  if (!user) {
    return [];
  }

  const sql = getDb();

  try {
    const follows = await sql`
      SELECT topic_name
      FROM topic_follows
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return follows.map((f: any) => f.topic_name);
  } catch (error) {
    console.error("Error fetching followed topics:", error);
    return [];
  }
}
