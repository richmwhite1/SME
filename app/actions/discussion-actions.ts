"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkVibe, checkVibeForGuest } from "@/lib/vibe-check";
import { checkUserBanned, checkKeywordBlacklist, handleBlacklistedContent } from "@/lib/trust-safety";

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

  // Check if user is banned
  const isBanned = await checkUserBanned(user.id);
  if (isBanned) {
    throw new Error("Your laboratory access has been restricted");
  }

  const sql = getDb();

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

  console.log('Insert Discussion Data:', {
    title: trimmedTitle,
    content: trimmedContent,
    author_id: user.id,
    slug: uniqueSlug,
    tags: validTags,
    reference_url: validReferenceUrl,
  });

  try {
    // Insert discussion using raw SQL
    const result = await sql`
      INSERT INTO discussions (
        title, content, author_id, slug, tags, reference_url,
        flag_count, is_flagged, upvote_count
      )
      VALUES (
        ${trimmedTitle}, ${trimmedContent}, ${user.id}, ${uniqueSlug},
        ${sql.array(validTags)}, ${validReferenceUrl},
        0, false, 0
      )
      RETURNING id
    `;

    const discussion = result[0];
    
    if (!discussion || !discussion.id) {
      console.error("Discussion insert returned no data");
      throw new Error("Discussion was not created. Please try again.");
    }

    console.log("Discussion successfully created:", discussion.id);

    revalidatePath("/discussions");
    revalidatePath("/feed");

    // Return ID instead of slug for direct navigation
    return { success: true, id: discussion.id };
  } catch (error: any) {
    console.error("Error creating discussion:", error);
    
    // Return structured error instead of throwing
    let errorMessage = "Failed to create discussion";
    
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      errorMessage = "Discussions table not found. Please run the SQL migration.";
    } else if (error.message?.includes("foreign key") || error.code === "23503") {
      errorMessage = "Database constraint error. Please ensure your profile is set up correctly.";
    } else if (error.message?.includes("permission") || error.code === "42501") {
      errorMessage = "Permission denied. Please contact support.";
    } else {
      errorMessage = `Failed to create discussion: ${error.message || "Unknown error"}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Create a comment on a discussion
 * Guest users require AI moderation, authenticated users bypass it
 */
interface ResourceReference {
  resource_id: string;
  resource_title: string;
  resource_url: string | null;
}

export async function createDiscussionComment(
  discussionId: string,
  content: string,
  discussionSlug: string,
  parentId?: string,
  references?: ResourceReference[]
) {
  const user = await currentUser();
  const sql = getDb();

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
    // Check if user is banned
    const isBanned = await checkUserBanned(user.id);
    if (isBanned) {
      throw new Error("Your laboratory access has been restricted");
    }

    // Check keyword blacklist (Revenue Guard)
    const blacklistMatches = await checkKeywordBlacklist(trimmedContent);
    const shouldAutoFlag = blacklistMatches.length > 0;

    try {
      // Insert comment using raw SQL
      const result = await sql`
        INSERT INTO discussion_comments (
          discussion_id, author_id, content, parent_id, flag_count, is_flagged
        )
        VALUES (
          ${discussionId}, ${user.id}, ${trimmedContent}, ${parentId || null},
          ${shouldAutoFlag ? 1 : 0}, ${shouldAutoFlag}
        )
        RETURNING id
      `;

      const commentData = result[0];

      if (!commentData || !commentData.id) {
        console.error("Comment insert returned no data");
        throw new Error("Comment was not created. Please try again.");
      }

      console.log("Comment successfully created:", commentData.id);

      // If blacklisted keyword found, auto-flag and move to moderation queue
      if (shouldAutoFlag && blacklistMatches.length > 0) {
        await handleBlacklistedContent(
          commentData.id,
          "discussion",
          trimmedContent,
          discussionId,
          undefined,
          user.id,
          undefined,
          parentId || undefined,
          new Date().toISOString()
        );
        console.log("Comment auto-flagged due to blacklisted keyword:", blacklistMatches[0].keyword);
      }

      // Insert references if provided with error handling
      if (references && references.length > 0 && commentData?.id) {
        try {
          for (const ref of references) {
            await sql`
              INSERT INTO comment_references (
                comment_id, resource_id, resource_title, resource_url
              )
              VALUES (
                ${commentData.id}, ${ref.resource_id}, ${ref.resource_title}, ${ref.resource_url}
              )
            `;
          }
        } catch (refError) {
          console.error("Error creating comment references (table may not exist):", refError);
          // Don't fail the whole operation if references table doesn't exist
        }
      }
    } catch (error: any) {
      console.error("Error creating comment:", error);
      
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        throw new Error(
          "Discussion comments table not found or schema mismatch. Please run the SQL migration."
        );
      }
      if (error.message?.includes("type") || error.message?.includes("UUID")) {
        throw new Error(
          "Schema mismatch: author_id column type is incorrect. Please run the schema fix migration."
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

/**
 * Create a guest comment (unauthenticated user)
 * Requires AI moderation and guest name
 */
export async function createGuestComment(
  discussionId: string,
  content: string,
  guestName: string,
  discussionSlug: string,
  parentId?: string
) {
  const user = await currentUser();
  const sql = getDb();

  // Ensure user is NOT authenticated (this is for guests only)
  if (user) {
    throw new Error("Authenticated users should use createDiscussionComment");
  }

  // Validate guest name
  const trimmedGuestName = guestName.trim();
  if (!trimmedGuestName || trimmedGuestName.length < 2) {
    throw new Error("Guest name must be at least 2 characters long");
  }
  if (trimmedGuestName.length > 50) {
    throw new Error("Guest name must be less than 50 characters");
  }

  // Trim and validate content
  const trimmedContent = content.trim();
  if (trimmedContent.length < 10) {
    throw new Error("Comment must be at least 10 characters long");
  }
  if (trimmedContent.length > 2000) {
    throw new Error("Comment must be less than 2000 characters");
  }

  // Guest users require AI moderation with stricter prompt
  const vibeResult = await checkVibeForGuest(trimmedContent);
  if (!vibeResult.isSafe) {
    throw new Error("This signal does not meet laboratory standards.");
  }

  try {
    // Insert guest comment using raw SQL
    const result = await sql`
      INSERT INTO discussion_comments (
        discussion_id, author_id, guest_name, content, parent_id, flag_count, is_flagged
      )
      VALUES (
        ${discussionId}, NULL, ${trimmedGuestName}, ${trimmedContent}, ${parentId || null}, 0, false
      )
      RETURNING id
    `;

    const commentData = result[0];

    if (!commentData || !commentData.id) {
      console.error("Guest comment insert returned no data");
      throw new Error("Comment was not created. Please try again.");
    }

    console.log("Guest comment successfully created:", commentData.id);

    // Revalidate paths to ensure new comment appears
    revalidatePath(`/discussions/${discussionSlug}`, "page");
    revalidatePath(`/discussions/[slug]`, "page");
    revalidatePath("/discussions", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Error creating guest comment:", error);
    
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      throw new Error(
        "Discussion comments table not found or schema mismatch. Please run the SQL migration."
      );
    }
    if (error.message?.includes("check_guest_comment")) {
      throw new Error(
        "Invalid comment data. Guest comments must have guest_name and no author_id."
      );
    }
    throw new Error(`Failed to create comment: ${error.message}`);
  }
}

/**
 * Resolve a bounty discussion by accepting a comment as the solution
 * Only the discussion author can resolve bounties
 */
export async function resolveBounty(
  discussionId: string,
  commentId: string,
  discussionSlug: string
) {
  const user = await currentUser();
  const sql = getDb();

  if (!user) {
    throw new Error("You must be logged in to resolve bounties");
  }

  try {
    // Verify the discussion exists and is a bounty
    const discussionResult = await sql`
      SELECT id, author_id, is_bounty, bounty_status, tags
      FROM discussions
      WHERE id = ${discussionId}
    `;

    const discussion = discussionResult[0];

    if (!discussion) {
      throw new Error("Discussion not found");
    }

    // Verify user is the author
    if (discussion.author_id !== user.id) {
      throw new Error("Only the discussion author can resolve bounties");
    }

    // Verify it's a bounty
    if (!discussion.is_bounty) {
      throw new Error("This discussion is not a bounty");
    }

    // Verify it's not already resolved
    if (discussion.bounty_status === "resolved") {
      throw new Error("This bounty is already resolved");
    }

    // Get the comment author
    const commentResult = await sql`
      SELECT author_id
      FROM discussion_comments
      WHERE id = ${commentId}
    `;

    const comment = commentResult[0];

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Update discussion: mark as resolved and set solution_comment_id
    await sql`
      UPDATE discussions
      SET bounty_status = 'resolved', solution_comment_id = ${commentId}
      WHERE id = ${discussionId}
    `;

    // Call stored procedure to update reputation
    try {
      await sql`
        SELECT update_bounty_reputation(
          ${commentId}::uuid,
          ${discussion.tags?.[0] || null}::text
        )
      `;
    } catch (rpcError) {
      console.error("Error updating reputation via RPC:", rpcError);
      // Don't fail the whole operation if RPC fails, but log it
    }

    // Revalidate paths
    revalidatePath(`/discussions/${discussionSlug}`, "page");
    revalidatePath(`/discussions/[slug]`, "page");
    revalidatePath("/discussions", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Error resolving bounty:", error);
    throw new Error(error.message || "Failed to resolve bounty");
  }
}

/**
 * Flag a discussion comment
 * Inserts a record into discussion_flags table
 * The database trigger handles auto-archival to moderation_queue
 */
export async function flagComment(commentId: string) {
  const user = await currentUser();
  const sql = getDb();

  if (!user) {
    throw new Error("You must be logged in to flag comments");
  }

  try {
    // Check if user already flagged this comment
    const existingFlagResult = await sql`
      SELECT id
      FROM discussion_flags
      WHERE comment_id = ${commentId}
        AND flagged_by = ${user.id}
      LIMIT 1
    `;

    if (existingFlagResult.length > 0) {
      throw new Error("You have already reported this signal");
    }

    // Insert flag record
    await sql`
      INSERT INTO discussion_flags (comment_id, flagged_by)
      VALUES (${commentId}, ${user.id})
    `;

    // Revalidate paths
    revalidatePath("/discussions", "page");
    revalidatePath("/admin", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Error flagging comment:", error);
    throw new Error(error.message || "Failed to flag comment");
  }
}

