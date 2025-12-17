"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();

  // Normalize topic name (trim, lowercase for consistency)
  const normalizedTopic = topicName.trim();

  if (!normalizedTopic) {
    throw new Error("Topic name cannot be empty");
  }

  // Check if user is already following this topic
  const { data: existingFollow, error: checkError } = await supabase
    .from("topic_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("topic_name", normalizedTopic)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking topic follow:", checkError);
    throw new Error(`Failed to check topic follow: ${checkError.message}`);
  }

  if (existingFollow) {
    // Unfollow: Delete the follow record
    const { error: deleteError } = await supabase
      .from("topic_follows")
      .delete()
      .eq("id", existingFollow.id);

    if (deleteError) {
      console.error("Error unfollowing topic:", deleteError);
      throw new Error(`Failed to unfollow topic: ${deleteError.message}`);
    }

    revalidatePath("/feed", "page");
    revalidatePath("/discussions", "page");
    revalidatePath("/topics", "page");
    return { success: true, following: false };
  } else {
    // Follow: Insert new follow record
    const { error: insertError } = await supabase
      .from("topic_follows")
      .insert({
        user_id: user.id,
        topic_name: normalizedTopic,
      } as any);

    if (insertError) {
      console.error("Error following topic:", insertError);
      throw new Error(`Failed to follow topic: ${insertError.message}`);
    }

    revalidatePath("/feed", "page");
    revalidatePath("/discussions", "page");
    revalidatePath("/topics", "page");
    return { success: true, following: true };
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

  const supabase = createClient();

  const { data: follows, error } = await supabase
    .from("topic_follows")
    .select("topic_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching followed topics:", error);
    return [];
  }

  return (follows || []).map((f: { topic_name: string }) => f.topic_name);
}

