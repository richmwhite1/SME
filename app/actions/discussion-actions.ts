"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkVibe } from "@/lib/vibe-check";

/**
 * Create a new discussion
 * Guest users require AI moderation, authenticated users bypass it
 */
export async function createDiscussion(
  title: string,
  content: string,
  tags: string[] = [],
  referenceUrl?: string
) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to create a discussion");
  }

  const supabase = createClient();

  // Validate inputs
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
    throw new Error("Title must be between 5 and 200 characters");
  }

  if (trimmedContent.length < 20) {
    throw new Error("Content must be at least 20 characters long");
  }

  // Validate tags
  const validTags = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 5); // Max 5 tags

  // Guest users require AI moderation (though guests can't create discussions)
  // Authenticated users bypass AI moderation (SME Freedom)
  console.log("Skipping AI moderation for authenticated user (SME freedom)");

  // Generate unique slug from title
  const baseSlug = trimmedTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const uniqueSlug = `${baseSlug}-${Date.now()}`;

  // Validate reference URL if provided
  let validReferenceUrl: string | null = null;
  if (referenceUrl && referenceUrl.trim()) {
    const trimmedUrl = referenceUrl.trim();
    try {
      // Basic URL validation
      new URL(trimmedUrl);
      validReferenceUrl = trimmedUrl;
    } catch {
      throw new Error("Reference URL must be a valid URL");
    }
  }

  // Insert discussion
  const { data: discussion, error } = await supabase
    .from("discussions")
    .insert({
      title: trimmedTitle,
      content: trimmedContent,
      author_id: user.id,
      slug: uniqueSlug,
      tags: validTags.length > 0 ? validTags : [],
      reference_url: validReferenceUrl,
      flag_count: 0,
      is_flagged: false,
      upvote_count: 0,
    } as any)
    .select("slug")
    .single();

  if (error) {
    console.error("Error creating discussion:", error);
    throw new Error(`Failed to create discussion: ${error.message}`);
  }

  revalidatePath("/discussions");
  revalidatePath("/feed");

  return { success: true, slug: discussion.slug };
}

/**
 * Create a comment on a discussion
 * Guest users require AI moderation, authenticated users bypass it
 */
export async function createDiscussionComment(
  discussionId: string,
  content: string,
  discussionSlug: string
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
      .from("discussion_comments")
      .insert({
        discussion_id: discussionId,
        author_id: user.id, // Clerk ID is TEXT, matches profiles.id
        content: trimmedContent,
        flag_count: 0,
        is_flagged: false,
      } as any);

    if (error) {
      console.error("Error creating comment:", error);
      // Check if table doesn't exist or schema mismatch
      if (error.message?.includes("does not exist") || error.message?.includes("schema")) {
        throw new Error(
          "Discussion comments table not found or schema mismatch. Please run the SQL migration: supabase-fix-discussion-comments-schema.sql in your Supabase SQL Editor."
        );
      }
      if (error.message?.includes("type") || error.message?.includes("UUID")) {
        throw new Error(
          "Schema mismatch: author_id column type is incorrect. Please run: supabase-fix-discussion-comments-schema.sql in your Supabase SQL Editor."
        );
      }
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  } else {
    // Guest comments not supported for discussions (only authenticated users)
    throw new Error("You must be logged in to comment on discussions");
  }

  // Revalidate paths to ensure new comment appears
  revalidatePath(`/discussions/${discussionSlug}`, "page");
  revalidatePath(`/discussions/[slug]`, "page");
  revalidatePath("/discussions", "page");

  return { success: true };
}

