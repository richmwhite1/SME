"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/trust-safety";
import { getDb } from "@/lib/db";

/**
 * Toggle SME certification status for a product
 * Admin only
 */
export async function toggleProductCertification(
  protocolId: string,
  isCertified: boolean,
  certificationData?: {
    certification_notes?: string;
    third_party_lab_verified?: boolean;
    purity_tested?: boolean;
    source_transparency?: boolean;
    potency_verified?: boolean;
    excipient_audit?: boolean;
    operational_legitimacy?: boolean;
    coa_url?: string;
  }
) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can manage product certification");
  }

  const sql = getDb();

  const updateFields: { [key: string]: any } = {
    is_sme_certified: isCertified,
  };

  // Update certification fields if provided
  if (certificationData) {
    Object.entries(certificationData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[key] = value;
      }
    });
  }

  try {
    // Build dynamic UPDATE query
    const setClauses = Object.entries(updateFields)
      .map(([key, value]) => `${key} = ${sql(value)}`)
      .join(', ');

    await sql`UPDATE products SET ${sql(setClauses)} WHERE id = ${protocolId}`;

    revalidatePath("/admin");
    revalidatePath("/products");
    revalidatePath(`/products/[slug]`, "page");

    return { success: true };
  } catch (error) {
    console.error("Error updating product certification:", error);
    throw new Error(`Failed to update certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all flagged content across the site
 * Admin only
 */
export async function getFlaggedContent() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view flagged content");
  }

  const sql = getDb();

  try {
    // Get flagged discussions
    const flaggedDiscussions = await sql`
      SELECT 
        d.id, d.title, d.slug, d.created_at, d.flag_count, d.is_flagged, d.author_id,
        json_build_object('full_name', p.full_name, 'username', p.username) as profiles
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE d.is_flagged = true OR d.flag_count > 0
      ORDER BY d.flag_count DESC, d.created_at DESC
      LIMIT 20
    `;

    // Get flagged reviews
    const flaggedReviews = await sql`
      SELECT 
        r.id, r.content, r.created_at, r.flag_count, r.is_flagged, r.user_id, r.protocol_id,
        json_build_object('full_name', p.full_name, 'username', p.username) as profiles,
        json_build_object('title', pr.title, 'slug', pr.slug) as protocols
      FROM reviews r
      LEFT JOIN profiles p ON r.user_id = p.id
      LEFT JOIN products pr ON r.product_id = pr.id
      WHERE r.is_flagged = true OR r.flag_count > 0
      ORDER BY r.flag_count DESC, r.created_at DESC
      LIMIT 20
    `;

    // Get flagged discussion comments
    const flaggedComments = await sql`
      SELECT 
        dc.id, dc.content, dc.created_at, dc.flag_count, dc.is_flagged, dc.author_id, dc.discussion_id,
        json_build_object('full_name', p.full_name, 'username', p.username) as profiles,
        json_build_object('title', d.title, 'slug', d.slug) as discussions
      FROM discussion_comments dc
      LEFT JOIN profiles p ON dc.author_id = p.id
      LEFT JOIN discussions d ON dc.discussion_id = d.id
      WHERE dc.is_flagged = true OR dc.flag_count > 0
      ORDER BY dc.flag_count DESC, dc.created_at DESC
      LIMIT 20
    `;

    // Get flagged product comments
    const flaggedProductComments = await sql`
      SELECT 
        pc.id, pc.content, pc.created_at, pc.flag_count, pc.is_flagged, pc.author_id, pc.protocol_id,
        json_build_object('full_name', p.full_name, 'username', p.username) as profiles,
        json_build_object('title', pr.title, 'slug', pr.slug) as protocols
      FROM product_comments pc
      LEFT JOIN profiles p ON pc.author_id = p.id
      LEFT JOIN products pr ON pc.protocol_id = pr.id
      WHERE pc.is_flagged = true OR pc.flag_count > 0
      ORDER BY pc.flag_count DESC, pc.created_at DESC
      LIMIT 20
    `;

    return {
      discussions: flaggedDiscussions || [],
      reviews: flaggedReviews || [],
      discussionComments: flaggedComments || [],
      productComments: flaggedProductComments || [],
      errors: {},
    };
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    throw error;
  }
}

/**
 * Restore a flagged comment
 * Admin only - resets flags and makes comment visible again
 */
export async function restoreComment(commentId: string, type: "discussion" | "product") {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can restore comments");
  }

  const sql = getDb();
  const tableName = type === "discussion" ? "discussion_comments" : "product_comments";

  try {
    await sql`
      UPDATE ${sql(tableName)}
      SET flag_count = 0, is_flagged = false
      WHERE id = ${commentId}
    `;

    return { success: true };
  } catch (error) {
    console.error("Error restoring comment:", error);
    throw new Error(`Failed to restore comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete a flagged comment
 * Admin only
 */
export async function deleteComment(commentId: string, type: "discussion" | "product") {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can delete comments");
  }

  const sql = getDb();
  const tableName = type === "discussion" ? "discussion_comments" : "product_comments";

  try {
    await sql`DELETE FROM ${sql(tableName)} WHERE id = ${commentId}`;

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error(`Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all records from moderation_queue
 * Admin only
 */
export async function getModerationQueue() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view moderation queue");
  }

  const sql = getDb();

  try {
    const queueItems = await sql`
      SELECT 
        mq.id, mq.original_comment_id, mq.comment_type, mq.discussion_id, mq.protocol_id,
        mq.author_id, mq.guest_name, mq.content, mq.flag_count, mq.original_created_at,
        mq.queued_at, mq.parent_id, mq.status, mq.dispute_reason,
        json_build_object('title', d.title, 'slug', d.slug) as discussions,
        json_build_object('title', pr.title, 'slug', pr.slug) as protocols,
        json_build_object('full_name', p.full_name, 'username', p.username) as profiles
      FROM moderation_queue mq
      LEFT JOIN discussions d ON mq.discussion_id = d.id
      LEFT JOIN products pr ON mq.protocol_id = pr.id
      LEFT JOIN profiles p ON mq.author_id = p.id
      ORDER BY mq.flag_count DESC, mq.queued_at DESC
    `;

    return queueItems || [];
  } catch (error) {
    console.error("Error fetching moderation queue:", error);
    throw new Error(`Failed to fetch moderation queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore a comment from moderation_queue back to discussion_comments or product_comments
 * Admin only
 */
export async function restoreFromQueue(queueItemId: string, reason?: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can restore comments");
  }

  const sql = getDb();

  try {
    // Get the queue item
    const queueItems = await sql`
      SELECT * FROM moderation_queue WHERE id = ${queueItemId}
    `;

    if (!queueItems || queueItems.length === 0) {
      throw new Error("Queue item not found");
    }

    const queueItem = queueItems[0];
    const tableName = queueItem.comment_type === "product" ? "product_comments" : "discussion_comments";

    // Prepare insert data
    const insertData: any = {
      id: queueItem.original_comment_id,
      content: queueItem.content,
      flag_count: 0,
      is_flagged: false,
      created_at: queueItem.original_created_at,
      updated_at: new Date().toISOString(),
    };

    if (queueItem.comment_type === "product") {
      insertData.protocol_id = queueItem.protocol_id;
      insertData.author_id = queueItem.author_id;
      insertData.parent_id = queueItem.parent_id || null;
    } else {
      insertData.discussion_id = queueItem.discussion_id;
      insertData.author_id = queueItem.author_id;
      insertData.guest_name = queueItem.guest_name;
      insertData.parent_id = queueItem.parent_id || null;
    }

    // Try to insert, or update if already exists
    try {
      await sql`
        INSERT INTO ${sql(tableName)} ${sql(insertData)}
      `;
    } catch (insertError) {
      // If insert fails, try to update
      await sql`
        UPDATE ${sql(tableName)}
        SET flag_count = 0, is_flagged = false
        WHERE id = ${queueItem.original_comment_id}
      `;
    }

    // Delete from moderation_queue
    await sql`DELETE FROM moderation_queue WHERE id = ${queueItemId}`;

    // Log admin action
    const user = await currentUser();
    if (user) {
      await logAdminAction(
        user.id,
        "restore",
        "comment",
        queueItem.original_comment_id,
        reason,
        {
          comment_type: queueItem.comment_type,
          flag_count: queueItem.flag_count,
          content_preview: queueItem.content.substring(0, 100),
        }
      );
    }

    revalidatePath("/admin");
    revalidatePath("/discussions");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Error restoring from queue:", error);
    throw new Error(`Failed to restore comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Permanently delete a comment from moderation_queue
 * Admin only
 */
export async function purgeFromQueue(queueItemId: string, reason?: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can purge comments");
  }

  const sql = getDb();

  try {
    // Get queue item for logging
    const queueItems = await sql`
      SELECT * FROM moderation_queue WHERE id = ${queueItemId}
    `;

    const queueItem = queueItems && queueItems.length > 0 ? queueItems[0] : null;

    // Delete from moderation_queue
    await sql`DELETE FROM moderation_queue WHERE id = ${queueItemId}`;

    // Log admin action
    const user = await currentUser();
    if (user && queueItem) {
      await logAdminAction(
        user.id,
        "purge",
        "comment",
        queueItem.original_comment_id,
        reason,
        {
          comment_type: queueItem.comment_type,
          flag_count: queueItem.flag_count,
          content_preview: queueItem.content.substring(0, 100),
        }
      );
    }

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error purging comment:", error);
    throw new Error(`Failed to purge comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add keyword to blacklist
 * Admin only
 */
export async function addBlacklistKeyword(keyword: string, reason?: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can manage blacklist");
  }

  const user = await currentUser();
  const sql = getDb();

  try {
    await sql`
      INSERT INTO keyword_blacklist (keyword, reason, created_by, is_active, created_at)
      VALUES (${keyword.trim().toLowerCase()}, ${reason || null}, ${user?.id || null}, true, NOW())
    `;

    // Log admin action
    if (user) {
      await logAdminAction(
        user.id,
        "add_blacklist",
        "keyword",
        keyword,
        reason,
        { keyword: keyword.trim().toLowerCase() }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error adding blacklist keyword:", error);
    throw new Error(`Failed to add keyword: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove keyword from blacklist
 * Admin only
 */
export async function removeBlacklistKeyword(keywordId: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can manage blacklist");
  }

  const user = await currentUser();
  const sql = getDb();

  try {
    // Get keyword before updating for logging
    const keywords = await sql`
      SELECT keyword FROM keyword_blacklist WHERE id = ${keywordId}
    `;

    const keyword = keywords && keywords.length > 0 ? keywords[0] : null;

    await sql`
      UPDATE keyword_blacklist SET is_active = false WHERE id = ${keywordId}
    `;

    // Log admin action
    if (user && keyword) {
      await logAdminAction(
        user.id,
        "remove_blacklist",
        "keyword",
        keywordId,
        undefined,
        { keyword: keyword.keyword }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error removing blacklist keyword:", error);
    throw new Error(`Failed to remove keyword: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all blacklist keywords
 * Admin only
 */
export async function getBlacklistKeywords() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view blacklist");
  }

  const sql = getDb();

  try {
    const data = await sql`
      SELECT * FROM keyword_blacklist
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return data || [];
  } catch (error) {
    console.error("Error fetching blacklist keywords:", error);
    throw new Error(`Failed to fetch keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Ban or unban a user
 * Admin only
 */
export async function toggleUserBan(userId: string, ban: boolean, reason?: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can ban users");
  }

  const user = await currentUser();
  const sql = getDb();

  try {
    const updateData: any = {
      is_banned: ban,
      banned_at: ban ? new Date().toISOString() : null,
      ban_reason: ban ? (reason || null) : null,
    };

    // Build UPDATE query dynamically
    const updates = Object.entries(updateData);
    if (updates.length === 0) {
      throw new Error("No update data provided");
    }

    // Use unsafe for dynamic column updates (in this controlled admin context, this is acceptable)
    const setClausesStr = updates
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(', ');

    const values: any[] = updates.map(([, value]) => value);
    values.push(userId);

    await sql.unsafe(`UPDATE profiles SET ${setClausesStr} WHERE id = $${updates.length + 1}`, values as any);

    // Log admin action
    if (user) {
      await logAdminAction(
        user.id,
        ban ? "ban" : "unban",
        "user",
        userId,
        reason,
        { is_banned: ban }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user ban:", error);
    throw new Error(`Failed to ${ban ? "ban" : "unban"} user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all users for SME Management
 * Admin only
 */
export async function getAllUsers() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can view users");
  }

  const sql = getDb();

  try {
    const data = await sql`
      SELECT id, full_name, username, is_banned, banned_at, ban_reason, created_at, reputation_score, is_sme, user_role
      FROM profiles
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Submit a dispute for a flagged comment
 */
export async function submitDispute(queueItemId: string, disputeReason: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error("You must be logged in to submit a dispute");
  }

  const sql = getDb();

  try {
    // Verify the user is the author of the comment
    const queueItems = await sql`
      SELECT author_id FROM moderation_queue WHERE id = ${queueItemId}
    `;

    if (!queueItems || queueItems.length === 0) {
      throw new Error("Queue item not found");
    }

    const queueItem = queueItems[0];

    if (queueItem.author_id !== user.id) {
      throw new Error("You can only dispute your own comments");
    }

    // Update moderation queue with dispute
    await sql`
      UPDATE moderation_queue
      SET dispute_reason = ${disputeReason.trim()}, status = 'disputed'
      WHERE id = ${queueItemId}
    `;

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error submitting dispute:", error);
    throw error;
  }
}

/**
 * Get user's own flagged comments from moderation queue
 * Allows users to see and dispute their own flagged content
 */
export async function getMyFlaggedComments(userId: string) {
  const sql = getDb();

  try {
    const queueItems = await sql`
      SELECT 
        mq.id, mq.original_comment_id, mq.comment_type, mq.discussion_id, mq.protocol_id,
        mq.content, mq.flag_count, mq.original_created_at, mq.queued_at, mq.status,
        mq.dispute_reason,
        json_build_object('title', d.title, 'slug', d.slug) as discussions,
        json_build_object('title', pr.title, 'slug', pr.slug) as protocols
      FROM moderation_queue mq
      LEFT JOIN discussions d ON mq.discussion_id = d.id
      LEFT JOIN products pr ON mq.protocol_id = pr.id
      WHERE mq.author_id = ${userId}
      ORDER BY mq.queued_at DESC
    `;

    return queueItems || [];
  } catch (error) {
    console.error("Error fetching user's flagged comments:", error);
    throw new Error(`Failed to fetch flagged comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update evidence submission status
 * Admin only
 */
export async function updateSubmissionStatus(submissionId: string, status: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can update submission status");
  }

  const sql = getDb();

  try {
    await sql`
      UPDATE evidence_submissions
      SET status = ${status}
      WHERE id = ${submissionId}
    `;

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating submission status:", error);
    throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update general product details
 * Admin only
 */
export async function updateProductDetails(
  productId: string,
  data: {
    title: string;
    brand: string;
    slug: string;
    description: string;
    manufacturer?: string;
    price?: string;
    serving_info?: string;
    warnings?: string;
    buy_url?: string;
    product_photos?: string[];
    ingredients?: string;
    tech_docs?: string; // Storing as JSON string or URL depending on schema
  }
) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can update products");
  }

  const sql = getDb();

  try {
    await sql`
      UPDATE products
      SET 
        title = ${data.title},
        brand = ${data.brand},
        slug = ${data.slug},
        description = ${data.description},
        manufacturer = ${data.manufacturer || null},
        price = ${data.price || null},
        serving_info = ${data.serving_info || null},
        warnings = ${data.warnings || null},
        buy_url = ${data.buy_url || null},
        product_photos = ${data.product_photos ? sql.array(data.product_photos) : null},
        ingredients = ${data.ingredients || null},
        technical_docs_url = ${data.tech_docs || null},
        updated_at = NOW()
      WHERE id = ${productId}
    `;

    revalidatePath('/admin');
    revalidatePath(`/products/${data.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update product details:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

/**
 * Permanently delete flagged content (discussions, reviews, comments)
 * Admin only
 */
export async function deleteFlaggedContent(id: string, type: "discussion" | "review" | "discussion_comment" | "product_comment") {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can delete content");
  }

  const sql = getDb();

  try {
    if (type === "discussion") {
      await sql`DELETE FROM discussions WHERE id = ${id}`;
    } else if (type === "review") {
      await sql`DELETE FROM reviews WHERE id = ${id}`;
    } else if (type === "discussion_comment") {
      await sql`DELETE FROM discussion_comments WHERE id = ${id}`;
    } else if (type === "product_comment") {
      await sql`DELETE FROM product_comments WHERE id = ${id}`;
    }

    // Log admin action
    const user = await currentUser();
    if (user) {
      await logAdminAction(
        user.id,
        "delete",
        type,
        id,
        "Flagged content deletion",
        { type }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting content:", error);
    throw new Error(`Failed to delete content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear flags from content
 * Admin only
 */
export async function clearContentFlag(id: string, type: "discussion" | "review" | "discussion_comment" | "product_comment") {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can clear flags");
  }

  const sql = getDb();
  const tableMap = {
    discussion: "discussions",
    review: "reviews",
    discussion_comment: "discussion_comments",
    product_comment: "product_comments"
  };

  const tableName = tableMap[type];
  if (!tableName) throw new Error("Invalid content type");

  try {
    // We use unsafe here because the table name is from a trusted map, not user input
    await sql.unsafe(`
      UPDATE ${tableName} 
      SET is_flagged = false, flag_count = 0 
      WHERE id = $1
    `, [id]);

    // Log admin action
    const user = await currentUser();
    if (user) {
      await logAdminAction(
        user.id,
        "clear_flags",
        type,
        id,
        "Flags cleared by admin"
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error clearing flags:", error);
    throw new Error(`Failed to clear flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Toggle SME status for a user
 * Admin only
 */
export async function toggleSME(userId: string, isSme: boolean) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can manage SME status");
  }

  const sql = getDb();

  try {
    await sql`UPDATE profiles SET is_sme = ${isSme} WHERE id = ${userId}`;

    // Log admin action
    const user = await currentUser();
    if (user) {
      await logAdminAction(
        user.id,
        isSme ? "grant_sme" : "revoke_sme",
        "user",
        userId,
        undefined,
        { is_sme: isSme }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error toggling SME:", error);
    throw new Error(`Failed to toggle SME status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update user role
 * Admin only
 */
export async function updateUserRole(userId: string, role: 'standard' | 'sme' | 'sme_admin' | 'admin' | 'business_user') {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can update user roles");
  }

  const validRoles = ['standard', 'sme', 'sme_admin', 'admin', 'business_user'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const sql = getDb();

  try {
    // Update user_role and corresponding boolean flags for backward compatibility
    const updates: any = {
      user_role: role,
      is_admin: role === 'admin',
      is_sme: role === 'sme' || role === 'sme_admin' || role === 'admin',
      is_verified_expert: role === 'sme_admin' || role === 'admin',
    };

    await sql`
      UPDATE profiles
      SET 
        user_role = ${updates.user_role},
        is_admin = ${updates.is_admin},
        is_sme = ${updates.is_sme},
        is_verified_expert = ${updates.is_verified_expert}
      WHERE id = ${userId}
    `;

    // Log admin action
    const user = await currentUser();
    if (user) {
      await logAdminAction(
        user.id,
        "update_role",
        "user",
        userId,
        `Changed role to ${role}`,
        { new_role: role }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reset user reputation
 * Admin only
 */
export async function resetReputation(userId: string, reason?: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can reset reputation");
  }

  const sql = getDb();

  try {
    await sql`UPDATE profiles SET reputation_score = 0 WHERE id = ${userId}`;

    // Log admin action
    const user = await currentUser();
    if (user) {
      await logAdminAction(
        user.id,
        "reset_reputation",
        "user",
        userId,
        reason,
        { previous_score: "unknown" }
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error resetting reputation:", error);
    throw new Error(`Failed to reset reputation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
