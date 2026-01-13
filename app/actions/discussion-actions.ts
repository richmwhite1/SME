"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkVibe, checkVibeForGuest } from "@/lib/ai/gemma-vibe-check";
import { checkUserBanned, checkKeywordBlacklist, handleBlacklistedContent } from "@/lib/trust-safety";
import { generateInsight } from "@/lib/ai/insight-engine";
import { createNotification } from "@/app/actions/notifications";

/**
 * Create a new discussion
 * Guest users require AI moderation, authenticated users bypass it
 */
export async function createDiscussion(
  title: string,
  content: string,
  tags: string[] = [],
  referenceUrl?: string,
  xPostUrl?: string
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
        flag_count, is_flagged, upvote_count, metadata
      )
      VALUES (
        ${trimmedTitle}, ${trimmedContent}, ${user.id}, ${uniqueSlug},
        ${sql.array(validTags)}, ${validReferenceUrl},
        0, false, 0, ${xPostUrl ? JSON.stringify({ x_post_url: xPostUrl }) : null}
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
  references?: ResourceReference[],
  postType?: 'verified_insight' | 'community_experience',
  pillarOfTruth?: string | null,
  isOfficialResponse?: boolean,
  xPostUrl?: string
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

    // Verify SME status if trying to mark as official response
    let canMarkOfficial = false;
    if (isOfficialResponse) {
      const profileResult = await sql`
        SELECT is_verified_expert, badge_type FROM profiles WHERE id = ${user.id}
      `;
      canMarkOfficial = profileResult[0]?.is_verified_expert || profileResult[0]?.badge_type === 'Trusted Voice';

      if (!canMarkOfficial) {
        throw new Error("Only verified experts can mark responses as official");
      }
    }

    try {
      // Determine post_type and pillar based on references
      const finalPostType = postType || (references && references.length > 0 ? 'verified_insight' : 'community_experience');
      const finalPillar = finalPostType === 'verified_insight' ? pillarOfTruth : null;

      // Insert comment using raw SQL
      const result = await sql`
        INSERT INTO discussion_comments (
          discussion_id, author_id, content, parent_id, flag_count, is_flagged, is_official_response,
          post_type, pillar_of_truth, metadata
        )
        VALUES (
          ${discussionId}, ${user.id}, ${trimmedContent}, ${parentId || null},
          ${shouldAutoFlag ? 1 : 0}, ${shouldAutoFlag}, ${isOfficialResponse && canMarkOfficial ? true : false},
          ${finalPostType}, ${finalPillar}, ${xPostUrl ? sql.json({ x_post_url: xPostUrl }) : null}
        )
        RETURNING id
      `;

      const commentData = result[0];

      if (!commentData || !commentData.id) {
        console.error("Comment insert returned no data");
        throw new Error("Comment was not created. Please try again.");
      }

      console.log("Comment successfully created:", commentData.id);

      // SME Insight Trigger (Gate A)
      // Process asynchronously (fire and forget pattern for speed)
      // We check for SME status and content length
      try {
        const profileResult = await sql`
          SELECT is_verified_expert, contributor_score 
          FROM profiles 
          WHERE id = ${user.id}
        `;
        const profile = profileResult[0];
        const isSME = profile?.is_verified_expert || (profile?.contributor_score || 0) >= 100;

        if (isSME && trimmedContent.length >= 50) {
          console.log("SME Comment detected, generating insight...");
          const insight = await generateInsight(trimmedContent);
          if (insight) {
            await sql`
              UPDATE discussion_comments
              SET insight_summary = ${insight}
              WHERE id = ${commentData.id}
            `;
            console.log("Insight saved for SME comment");
          }
        }
      } catch (err) {
        console.error("Error in SME insight generation:", err);
      }

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

      // --- NOTIFICATION LOOP: Notify users who raised their hand if an Expert replies ---
      if (parentId) {
        try {
          const profileResult = await sql`
            SELECT is_verified_expert, badge_type FROM profiles WHERE id = ${user.id}
           `;
          const isExpert = profileResult[0]?.is_verified_expert || profileResult[0]?.badge_type === 'Trusted Voice';

          if (isExpert) {
            console.log("Expert reply detected. Checking for signals on parent...");

            // Get users who raised hand on the parent comment
            const signalingUsers = await sql`
               SELECT DISTINCT user_id 
               FROM comment_signals 
               WHERE discussion_comment_id = ${parentId} 
               AND signal_type = 'raise_hand'
               AND user_id != ${user.id} 
             `;
            // (Added check to not notify the expert themselves if they signaled, though unlikely)

            if (signalingUsers.length > 0) {
              console.log(`Notifying ${signalingUsers.length} users who raised hand on parent ${parentId}`);

              const notificationTitle = "Expert Reply";
              const notificationMessage = "An expert has weighed in on a thread you signaled!";
              const notificationLink = `/discussions/${discussionSlug}?commentId=${commentData.id}`;

              // Send notifications in parallel
              await Promise.all(signalingUsers.map((u: any) =>
                createNotification(
                  u.user_id,
                  notificationTitle,
                  notificationMessage,
                  'success',
                  notificationLink
                )
              ));
            }
          }
        } catch (notifyError) {
          console.error("Error in Notification Loop:", notifyError);
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
  parentId?: string,
  xPostUrl?: string
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

  // Determine status based on confidence
  // Low confidence = borderline case, send to pending_review for admin approval
  const commentStatus = vibeResult.confidence === 'low' ? 'pending_review' : 'approved';

  try {
    // Insert guest comment using raw SQL
    const result = await sql`
      INSERT INTO discussion_comments (
        discussion_id, author_id, guest_name, content, parent_id, flag_count, is_flagged, status, metadata
      )
      VALUES (
        ${discussionId}, NULL, ${trimmedGuestName}, ${trimmedContent}, ${parentId || null}, 0, false, ${commentStatus},
        ${xPostUrl ? sql.json({ x_post_url: xPostUrl }) : null}
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
      WHERE id::text = ${discussionId} OR slug = ${discussionId}
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
 * Returns isHidden: true if comment reaches 3+ flags
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

    // Get updated flag count to determine if comment is hidden
    const flagCountResult = await sql`
      SELECT COUNT(*) as count
      FROM discussion_flags
      WHERE comment_id = ${commentId}
    `;

    const count = flagCountResult[0]?.count || 0;
    const isHidden = count >= 3;

    // Revalidate paths
    revalidatePath("/discussions", "page");
    revalidatePath("/admin", "page");

    return { success: true, isHidden };
  } catch (error: any) {
    console.error("Error flagging comment:", error);
    throw new Error(error.message || "Failed to flag comment");
  }
}

/**
 * Toggle an emoji reaction on a comment
 */
export async function toggleReaction(commentId: string, emoji: string) {
  const user = await currentUser();
  const sql = getDb();

  if (!user) {
    throw new Error("You must be logged in to react");
  }

  try {
    // Check if reaction exists
    const existing = await sql`
      SELECT id FROM comment_reactions
      WHERE comment_id = ${commentId} AND user_id = ${user.id} AND emoji = ${emoji}
    `;

    let isAdded = false;

    if (existing.length > 0) {
      // Remove reaction
      await sql`
        DELETE FROM comment_reactions
        WHERE comment_id = ${commentId} AND user_id = ${user.id} AND emoji = ${emoji}
      `;
    } else {
      // Add reaction
      await sql`
        INSERT INTO comment_reactions (comment_id, user_id, emoji)
        VALUES (${commentId}, ${user.id}, ${emoji})
      `;
      isAdded = true;
    }

    // Get updated counts for this comment
    const reactions = await sql`
      SELECT emoji, COUNT(*)::int as count
      FROM comment_reactions
      WHERE comment_id = ${commentId}
      GROUP BY emoji
    `;

    // Revalidate paths
    revalidatePath("/discussions");

    return { success: true, isAdded, reactions };
  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    throw new Error(error.message || "Failed to toggle reaction");
  }
}


/**
 * Fetch comments for a discussion
 * Replaces Supabase client-side query with raw SQL
 */
export async function getDiscussionComments(discussionId: string) {
  const sql = getDb();
  const user = await currentUser();
  const currentUserId = user?.id;

  try {
    const comments = await sql`
      SELECT 
        dc.id,
        dc.content,
        dc.created_at,
        dc.parent_id,
        dc.guest_name,
        dc.is_flagged,
        dc.insight_summary,
        dc.upvote_count,
        dc.metadata,
        p.id as author_id,
        p.full_name,
        p.username,
        p.avatar_url,
        p.badge_type,
        p.contributor_score,
        p.is_verified_expert,
        (
          SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.count, 'user_reacted', r.user_reacted))
          FROM (
            SELECT 
              emoji, 
              COUNT(*)::int as count,
              BOOL_OR(user_id = ${currentUserId || ''}) as user_reacted
            FROM comment_reactions
            WHERE comment_id = dc.id
            GROUP BY emoji
          ) r
        ) as reactions
      FROM discussion_comments dc
      LEFT JOIN profiles p ON dc.author_id = p.id
      WHERE (dc.discussion_id::text = ${discussionId} OR dc.discussion_id IN (SELECT id FROM discussions WHERE slug = ${discussionId}))
        AND (dc.is_flagged IS FALSE OR dc.is_flagged IS NULL)
      ORDER BY dc.created_at ASC
    `;

    return comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      parent_id: c.parent_id,
      guest_name: c.guest_name,
      is_flagged: c.is_flagged || false,
      insight_summary: c.insight_summary,
      upvote_count: c.upvote_count || 0,
      metadata: c.metadata || {},
      profiles: c.author_id ? {
        id: c.author_id,
        full_name: c.full_name,
        username: c.username,
        avatar_url: c.avatar_url,
        badge_type: c.badge_type,
        contributor_score: c.contributor_score,
        is_verified_expert: c.is_verified_expert
      } : null,
      reactions: c.reactions || []
    }));
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    // Return empty array on error to prevent UI crash, but log it
    return [];
  }
}

/**
 * Fetch discussions with pagination and filtering
 */
/**
 * Fetch discussions with pagination and filtering
 */
export async function fetchDiscussions(
  offset: number = 0,
  limit: number = 20,
  filters: {
    trusted?: boolean;
    topic?: string;
    search?: string;
    sort?: string;
  } = {}
) {
  const sql = getDb();
  const { trusted = false, topic, search, sort = "newest" } = filters;
  const searchQuery = search?.toLowerCase() || "";

  try {
    // Dynamic ORDER BY
    let orderByFragment = sql`ORDER BY d.created_at DESC`;
    if (sort === "active") {
      orderByFragment = sql`ORDER BY message_count DESC NULLS LAST, d.created_at DESC`;
    } else if (sort === "upvotes") {
      orderByFragment = sql`ORDER BY d.upvote_count DESC NULLS LAST, d.created_at DESC`;
    } else if (sort === "popularity") {
      orderByFragment = sql`ORDER BY (d.upvote_count + message_count) DESC NULLS LAST, d.created_at DESC`;
    }

    const rawResults = await sql`
      SELECT 
        d.id, d.title, d.content, d.tags, d.slug, d.created_at, d.upvote_count, d.author_id,
        (SELECT COUNT(*) FROM discussion_comments WHERE discussion_id = d.id)::int as message_count,
        (SELECT MAX(created_at) FROM discussion_comments WHERE discussion_id = d.id) as last_activity_at,
        (
          SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.count))
          FROM (
            SELECT emoji, COUNT(*) as count
            FROM comment_reactions cr 
            JOIN discussion_comments dc ON cr.comment_id = dc.id 
            WHERE dc.discussion_id = d.id 
            GROUP BY emoji 
            ORDER BY COUNT(*) DESC 
            LIMIT 3
          ) r
        ) as top_emojis,
        p.id as profile_id,
        p.full_name,
        p.username,
        p.avatar_url,
        p.badge_type
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE d.is_flagged = false
      ${trusted ? sql`AND p.badge_type = 'Trusted Voice'` : sql``}
      ${topic ? sql`AND ${topic} = ANY(d.tags)` : sql``}
      ${searchQuery ? sql`AND (LOWER(d.title) LIKE ${"%" + searchQuery + "%"} OR LOWER(d.content) LIKE ${"%" + searchQuery + "%"})` : sql``}
      ${orderByFragment}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Transform results to nest profile data
    return rawResults.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags,
      slug: row.slug,
      created_at: row.created_at,
      upvote_count: row.upvote_count,
      author_id: row.author_id,
      message_count: Number(row.message_count || 0),
      last_activity_at: row.last_activity_at,
      top_emojis: row.top_emojis,
      profiles: row.profile_id ? {
        id: row.profile_id,
        full_name: row.full_name,
        username: row.username,
        avatar_url: row.avatar_url,
        badge_type: row.badge_type
      } : null
    }));

  } catch (error) {
    console.error("Error fetching discussions:", error);
    return [];
  }
}
