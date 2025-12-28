import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Check if user is banned
 */
export async function checkUserBanned(userId: string): Promise<boolean> {
  const sql = getDb();

  try {
    const result = await sql`
      SELECT is_banned
      FROM profiles
      WHERE id = ${userId}
    `;

    return result[0]?.is_banned === true;
  } catch (error) {
    console.error("Error checking if user is banned:", error);
    return false;
  }
}

/**
 * Check content against keyword blacklist
 * Returns matching keywords if found
 */
export async function checkKeywordBlacklist(content: string): Promise<Array<{ keyword: string; reason: string | null }>> {
  const sql = getDb();

  try {
    // Fetch all active keywords
    const allKeywords = await sql`
      SELECT keyword, reason
      FROM keyword_blacklist
      WHERE is_active = true
    `;

    // Check for matches (case-insensitive)
    const lowerContent = content.toLowerCase();
    const matches = allKeywords.filter((kw: any) =>
      lowerContent.includes(kw.keyword.toLowerCase())
    );

    return matches.map((kw: any) => ({ keyword: kw.keyword, reason: kw.reason }));
  } catch (error) {
    console.error("Error fetching keyword blacklist:", error);
    return [];
  }
}

/**
 * Auto-flag and move to moderation queue if blacklisted keyword found
 */
export async function handleBlacklistedContent(
  commentId: string,
  commentType: "discussion" | "product",
  content: string,
  discussionId?: string | null,
  protocolId?: string | null,
  authorId?: string | null,
  guestName?: string | null,
  parentId?: string | null,
  originalCreatedAt?: string
): Promise<void> {
  const sql = getDb();

  try {
    // Get full comment data if needed
    let fullCommentData: any = {};
    if (commentType === "discussion") {
      const result = await sql`
        SELECT *
        FROM discussion_comments
        WHERE id = ${commentId}
      `;
      fullCommentData = result[0] || {};
    } else {
      const result = await sql`
        SELECT *
        FROM product_comments
        WHERE id = ${commentId}
      `;
      fullCommentData = result[0] || {};
    }

    // Move to moderation queue
    await sql`
      INSERT INTO moderation_queue (
        original_comment_id, comment_type, discussion_id, protocol_id,
        author_id, guest_name, content, flag_count, original_created_at,
        parent_id, status
      )
      VALUES (
        ${commentId}, ${commentType},
        ${discussionId || fullCommentData.discussion_id || null},
        ${protocolId || fullCommentData.protocol_id || null},
        ${authorId || fullCommentData.author_id || null},
        ${guestName || fullCommentData.guest_name || null},
        ${content}, 1,
        ${originalCreatedAt || fullCommentData.created_at || new Date().toISOString()},
        ${parentId || fullCommentData.parent_id || null},
        'pending'
      )
    `;

    // Update comment to be flagged
    const tableName = commentType === "product" ? "product_comments" : "discussion_comments";
    if (tableName === "product_comments") {
      await sql`
        UPDATE product_comments
        SET is_flagged = true, flag_count = 1
        WHERE id = ${commentId}
      `;
    } else {
      await sql`
        UPDATE discussion_comments
        SET is_flagged = true, flag_count = 1
        WHERE id = ${commentId}
      `;
    }
  } catch (error) {
    console.error("Error handling blacklisted content:", error);
  }
}

/**
 * Log admin action to audit log
 */
export async function logAdminAction(
  adminId: string,
  actionType: "restore" | "purge" | "ban" | "unban" | "add_blacklist" | "remove_blacklist" | "delete" | "clear_flags" | "grant_sme" | "revoke_sme" | "reset_reputation",
  targetType: "comment" | "user" | "keyword" | "discussion" | "review" | "discussion_comment" | "product_comment",
  targetId: string,
  reason?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const sql = getDb();

  try {
    await sql`
      INSERT INTO admin_logs (
        admin_id, action_type, target_type, target_id, reason, metadata
      )
      VALUES (
        ${adminId}, ${actionType}, ${targetType}, ${targetId},
        ${reason || null}, ${metadata ? sql.json(metadata) : null}
      )
    `;
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}

