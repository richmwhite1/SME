"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/trust-safety";

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

  const supabase = createClient();

  const updateData: any = {
    is_sme_certified: isCertified,
  };

  // Update certification fields if provided
  if (certificationData) {
    if (certificationData.certification_notes !== undefined) {
      updateData.certification_notes = certificationData.certification_notes;
    }
    if (certificationData.third_party_lab_verified !== undefined) {
      updateData.third_party_lab_verified = certificationData.third_party_lab_verified;
    }
    if (certificationData.purity_tested !== undefined) {
      updateData.purity_tested = certificationData.purity_tested;
    }
    if (certificationData.source_transparency !== undefined) {
      updateData.source_transparency = certificationData.source_transparency;
    }
    if (certificationData.potency_verified !== undefined) {
      updateData.potency_verified = certificationData.potency_verified;
    }
    if (certificationData.excipient_audit !== undefined) {
      updateData.excipient_audit = certificationData.excipient_audit;
    }
    if (certificationData.operational_legitimacy !== undefined) {
      updateData.operational_legitimacy = certificationData.operational_legitimacy;
    }
    if (certificationData.coa_url !== undefined) {
      updateData.coa_url = certificationData.coa_url;
    }
  }

  const { error } = await (supabase as any)
    .from("protocols")
    .update(updateData)
    .eq("id", protocolId);

  if (error) {
    console.error("Error updating product certification:", error);
    throw new Error(`Failed to update certification: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  revalidatePath(`/products/[slug]`, "page");

  return { success: true };
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

  const supabase = createClient();

  // Get flagged discussions
  const { data: flaggedDiscussions, error: discussionsError } = await supabase
    .from("discussions")
    .select(
      `
      id,
      title,
      slug,
      created_at,
      flag_count,
      is_flagged,
      author_id,
      profiles!discussions_author_id_fkey(
        full_name,
        username
      )
    `
    )
    .or("is_flagged.eq.true,flag_count.gt.0")
    .order("flag_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // Get flagged reviews
  const { data: flaggedReviews, error: reviewsError } = await supabase
    .from("reviews")
    .select(
      `
      id,
      content,
      created_at,
      flag_count,
      is_flagged,
      user_id,
      protocol_id,
      profiles!reviews_user_id_fkey(
        full_name,
        username
      ),
      protocols!reviews_protocol_id_fkey(
        title,
        slug
      )
    `
    )
    .or("is_flagged.eq.true,flag_count.gt.0")
    .order("flag_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // Get flagged discussion comments
  const { data: flaggedComments, error: commentsError } = await supabase
    .from("discussion_comments")
    .select(
      `
      id,
      content,
      created_at,
      flag_count,
      is_flagged,
      author_id,
      discussion_id,
      profiles!discussion_comments_author_id_fkey(
        full_name,
        username
      ),
      discussions!discussion_comments_discussion_id_fkey(
        title,
        slug
      )
    `
    )
    .or("is_flagged.eq.true,flag_count.gt.0")
    .order("flag_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // Get flagged product comments
  const { data: flaggedProductComments, error: productCommentsError } = await supabase
    .from("product_comments")
    .select(
      `
      id,
      content,
      created_at,
      flag_count,
      is_flagged,
      author_id,
      protocol_id,
      profiles!product_comments_author_id_fkey(
        full_name,
        username
      ),
      protocols!product_comments_protocol_id_fkey(
        title,
        slug
      )
    `
    )
    .or("is_flagged.eq.true,flag_count.gt.0")
    .order("flag_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    discussions: flaggedDiscussions || [],
    reviews: flaggedReviews || [],
    discussionComments: flaggedComments || [],
    productComments: flaggedProductComments || [],
    errors: {
      discussions: discussionsError,
      reviews: reviewsError,
      comments: commentsError,
      productComments: productCommentsError,
    },
  };
}

/**
 * Restore a flagged discussion comment
 * Admin only - resets flags and makes comment visible again
 */
export async function restoreComment(commentId: string, type: "discussion" | "product") {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error("Only administrators can restore comments");
  }

  const supabase = createClient();
  const tableName = type === "discussion" ? "discussion_comments" : "product_comments";

  const { error } = await (supabase as any)
    .from(tableName)
    .update({
      flag_count: 0,
      is_flagged: false,
    })
    .eq("id", commentId);

  if (error) {
    console.error("Error restoring comment:", error);
    throw new Error(`Failed to restore comment: ${error.message}`);
  }

  return { success: true };
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

  const supabase = createClient();
  const tableName = type === "discussion" ? "discussion_comments" : "product_comments";

  const { error } = await (supabase as any)
    .from(tableName)
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw new Error(`Failed to delete comment: ${error.message}`);
  }

  return { success: true };
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

  const supabase = createClient();

  const { data: queueItems, error } = await supabase
    .from("moderation_queue")
    .select(
      `
      id,
      original_comment_id,
      comment_type,
      discussion_id,
      protocol_id,
      author_id,
      guest_name,
      content,
      flag_count,
      original_created_at,
      queued_at,
      parent_id,
      status,
      dispute_reason,
      discussions!moderation_queue_discussion_id_fkey(
        title,
        slug
      ),
      protocols!moderation_queue_protocol_id_fkey(
        title,
        slug
      ),
      profiles!moderation_queue_author_id_fkey(
        full_name,
        username
      )
    `
    )
    .order("flag_count", { ascending: false })
    .order("queued_at", { ascending: false });

  if (error) {
    console.error("Error fetching moderation queue:", error);
    throw new Error(`Failed to fetch moderation queue: ${error.message}`);
  }

  return queueItems || [];
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

  const supabase = createClient();

  // First, get the queue item
  const { data: queueItemData, error: fetchError } = await (supabase as any)
    .from("moderation_queue")
    .select("*")
    .eq("id", queueItemId)
    .single();

  if (fetchError || !queueItemData) {
    throw new Error("Queue item not found");
  }

  const queueItem = queueItemData as any;

  // Determine which table to restore to based on comment_type
  const tableName = queueItem.comment_type === "product" ? "product_comments" : "discussion_comments";
  
  // Prepare insert data based on comment type
  const insertData: any = {
    id: queueItem.original_comment_id,
    content: queueItem.content,
    flag_count: 0, // Reset flag count
    is_flagged: false, // Reset flagged status
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

  // Restore the comment to the appropriate table
  const { error: insertError } = await (supabase as any)
    .from(tableName)
    .insert(insertData);

  if (insertError) {
    // If the comment already exists (maybe it wasn't deleted), just update it
    const { error: updateError } = await (supabase as any)
      .from(tableName)
      .update({
        flag_count: 0,
        is_flagged: false,
      })
      .eq("id", queueItem.original_comment_id);

    if (updateError) {
      console.error("Error restoring comment:", updateError);
      throw new Error(`Failed to restore comment: ${updateError.message}`);
    }
  }

  // Delete from moderation_queue
  const { error: deleteError } = await supabase
    .from("moderation_queue")
    .delete()
    .eq("id", queueItemId);

  if (deleteError) {
    console.error("Error removing from queue:", deleteError);
    throw new Error(`Failed to remove from queue: ${deleteError.message}`);
  }

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

  const supabase = createClient();

  // Get queue item for logging
  const { data: queueItemData } = await (supabase as any)
    .from("moderation_queue")
    .select("*")
    .eq("id", queueItemId)
    .single();

  const queueItem = queueItemData as any;

  // Delete from moderation_queue (this permanently removes it)
  const { error: deleteError } = await (supabase as any)
    .from("moderation_queue")
    .delete()
    .eq("id", queueItemId);

  if (deleteError) {
    console.error("Error purging comment:", deleteError);
    throw new Error(`Failed to purge comment: ${deleteError.message}`);
  }

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
  const supabase = createClient();

  const { error } = await (supabase as any)
    .from("keyword_blacklist")
    .insert({
      keyword: keyword.trim().toLowerCase(),
      reason: reason || null,
      created_by: user?.id || null,
      is_active: true,
    });

  if (error) {
    console.error("Error adding blacklist keyword:", error);
    throw new Error(`Failed to add keyword: ${error.message}`);
  }

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
  const supabase = createClient();

  // Get keyword before deleting for logging
  const { data: keyword } = await (supabase as any)
    .from("keyword_blacklist")
    .select("keyword")
    .eq("id", keywordId)
    .single();

  const { error } = await (supabase as any)
    .from("keyword_blacklist")
    .update({ is_active: false })
    .eq("id", keywordId);

  if (error) {
    console.error("Error removing blacklist keyword:", error);
    throw new Error(`Failed to remove keyword: ${error.message}`);
  }

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

  const supabase = createClient();
  const { data, error } = await supabase
    .from("keyword_blacklist")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blacklist keywords:", error);
    throw new Error(`Failed to fetch keywords: ${error.message}`);
  }

  return data || [];
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
  const supabase = createClient();

  const updateData: any = {
    is_banned: ban,
  };

  if (ban) {
    updateData.banned_at = new Date().toISOString();
    updateData.ban_reason = reason || null;
  } else {
    updateData.banned_at = null;
    updateData.ban_reason = null;
  }

  const { error } = await (supabase as any)
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    console.error("Error toggling user ban:", error);
    throw new Error(`Failed to ${ban ? "ban" : "unban"} user: ${error.message}`);
  }

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

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, is_banned, banned_at, ban_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data || [];
}

/**
 * Submit a dispute for a flagged comment
 */
export async function submitDispute(queueItemId: string, disputeReason: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error("You must be logged in to submit a dispute");
  }

  const supabase = createClient();

  // Verify the user is the author of the comment
  const { data: queueItemData, error: fetchError } = await (supabase as any)
    .from("moderation_queue")
    .select("author_id")
    .eq("id", queueItemId)
    .single();

  if (fetchError || !queueItemData) {
    throw new Error("Queue item not found");
  }

  const queueItem = queueItemData as any;

  if (queueItem.author_id !== user.id) {
    throw new Error("You can only dispute your own comments");
  }

  // Update moderation queue with dispute
  const { error: updateError } = await (supabase as any)
    .from("moderation_queue")
    .update({
      dispute_reason: disputeReason.trim(),
      status: "disputed",
    })
    .eq("id", queueItemId);

  if (updateError) {
    console.error("Error submitting dispute:", updateError);
    throw new Error(`Failed to submit dispute: ${updateError.message}`);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Get user's own flagged comments from moderation queue
 * Allows users to see and dispute their own flagged content
 */
export async function getMyFlaggedComments(userId: string) {
  const supabase = createClient();

  const { data: queueItems, error } = await supabase
    .from("moderation_queue")
    .select(
      `
      id,
      original_comment_id,
      comment_type,
      discussion_id,
      protocol_id,
      content,
      flag_count,
      original_created_at,
      queued_at,
      status,
      dispute_reason,
      discussions!moderation_queue_discussion_id_fkey(
        title,
        slug
      ),
      protocols!moderation_queue_protocol_id_fkey(
        title,
        slug
      )
    `
    )
    .eq("author_id", userId)
    .order("queued_at", { ascending: false });

  if (error) {
    console.error("Error fetching user's flagged comments:", error);
    throw new Error(`Failed to fetch flagged comments: ${error.message}`);
  }

  return queueItems || [];
}




