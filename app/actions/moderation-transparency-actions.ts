"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Moderation metrics interface
 */
export interface ModerationMetrics {
    total_flags_30d: number;
    total_resolved_30d: number;
    avg_resolution_hours: number;
    approval_rate: number;
    community_flag_ratio: number;
    appeals_submitted_30d: number;
    appeals_approval_rate: number;
}

/**
 * Appeal request interface
 */
export interface AppealRequest {
    id: string;
    content_type: 'discussion' | 'discussion_comment' | 'product_comment' | 'review';
    content_id: string;
    appellant_id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by?: string;
    admin_notes?: string;
    created_at: string;
    reviewed_at?: string;
}

/**
 * Get public moderation metrics for transparency page
 */
export async function getModerationMetrics(): Promise<ModerationMetrics> {
    const sql = getDb();

    try {
        const result = await sql<ModerationMetrics[]>`
      SELECT * FROM get_moderation_metrics_summary()
    `;

        return result[0] || {
            total_flags_30d: 0,
            total_resolved_30d: 0,
            avg_resolution_hours: 0,
            approval_rate: 0,
            community_flag_ratio: 0,
            appeals_submitted_30d: 0,
            appeals_approval_rate: 0
        };
    } catch (error) {
        console.error("Error fetching moderation metrics:", error);
        throw new Error("Failed to fetch moderation metrics");
    }
}

/**
 * Submit an appeal for flagged content
 */
export async function submitAppeal(
    contentType: 'discussion' | 'discussion_comment' | 'product_comment' | 'review',
    contentId: string,
    reason: string
): Promise<{ success: boolean; appealId?: string; error?: string }> {
    const user = await currentUser();

    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    if (!reason || reason.trim().length < 20) {
        return { success: false, error: "Appeal reason must be at least 20 characters" };
    }

    const sql = getDb();

    try {
        const result = await sql<{ submit_content_appeal: string }[]>`
      SELECT submit_content_appeal(
        ${contentType},
        ${contentId}::UUID,
        ${user.id},
        ${reason}
      ) as submit_content_appeal
    `;

        const appealId = result[0]?.submit_content_appeal;

        if (!appealId) {
            return { success: false, error: "Failed to create appeal" };
        }

        revalidatePath(`/moderation-policy`);

        return { success: true, appealId };
    } catch (error: any) {
        console.error("Error submitting appeal:", error);

        // Handle specific error messages from database
        if (error.message?.includes("not flagged")) {
            return { success: false, error: "This content is not currently flagged" };
        }
        if (error.message?.includes("already pending")) {
            return { success: false, error: "An appeal is already pending for this content" };
        }

        return { success: false, error: "Failed to submit appeal" };
    }
}

/**
 * Get appeal status for a specific appeal
 */
export async function getAppealStatus(appealId: string): Promise<AppealRequest | null> {
    const user = await currentUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    const sql = getDb();

    try {
        const result = await sql<AppealRequest[]>`
      SELECT 
        id::TEXT,
        content_type,
        content_id::TEXT,
        appellant_id,
        reason,
        status,
        reviewed_by,
        admin_notes,
        created_at::TEXT,
        reviewed_at::TEXT
      FROM appeal_requests
      WHERE id = ${appealId}
        AND appellant_id = ${user.id}
    `;

        return result[0] || null;
    } catch (error) {
        console.error("Error fetching appeal status:", error);
        throw new Error("Failed to fetch appeal status");
    }
}

/**
 * Get all appeals for current user
 */
export async function getUserAppeals(): Promise<AppealRequest[]> {
    const user = await currentUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    const sql = getDb();

    try {
        const appeals = await sql<AppealRequest[]>`
      SELECT 
        id::TEXT,
        content_type,
        content_id::TEXT,
        appellant_id,
        reason,
        status,
        reviewed_by,
        admin_notes,
        created_at::TEXT,
        reviewed_at::TEXT
      FROM appeal_requests
      WHERE appellant_id = ${user.id}
      ORDER BY created_at DESC
    `;

        return appeals;
    } catch (error) {
        console.error("Error fetching user appeals:", error);
        throw new Error("Failed to fetch user appeals");
    }
}

/**
 * Get pending appeals (admin only)
 */
export async function getPendingAppeals(): Promise<AppealRequest[]> {
    const user = await currentUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    const sql = getDb();

    // Check if user is admin
    const adminCheck = await sql`
    SELECT is_admin FROM profiles WHERE id = ${user.id}
  `;

    if (!adminCheck[0]?.is_admin) {
        throw new Error("Admin privileges required");
    }

    try {
        const appeals = await sql<AppealRequest[]>`
      SELECT 
        ar.id::TEXT,
        ar.content_type,
        ar.content_id::TEXT,
        ar.appellant_id,
        ar.reason,
        ar.status,
        ar.reviewed_by,
        ar.admin_notes,
        ar.created_at::TEXT,
        ar.reviewed_at::TEXT,
        p.full_name as appellant_name,
        p.username as appellant_username
      FROM appeal_requests ar
      JOIN profiles p ON ar.appellant_id = p.id
      WHERE ar.status = 'pending'
      ORDER BY ar.created_at ASC
    `;

        return appeals;
    } catch (error) {
        console.error("Error fetching pending appeals:", error);
        throw new Error("Failed to fetch pending appeals");
    }
}

/**
 * Review an appeal (admin only)
 */
export async function reviewAppeal(
    appealId: string,
    decision: 'approved' | 'rejected',
    adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
    const user = await currentUser();

    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    const sql = getDb();

    // Check if user is admin
    const adminCheck = await sql`
    SELECT is_admin FROM profiles WHERE id = ${user.id}
  `;

    if (!adminCheck[0]?.is_admin) {
        return { success: false, error: "Admin privileges required" };
    }

    try {
        // Get appeal details
        const appeal = await sql<AppealRequest[]>`
      SELECT * FROM appeal_requests WHERE id = ${appealId}
    `;

        if (!appeal[0]) {
            return { success: false, error: "Appeal not found" };
        }

        // Update appeal status
        await sql`
      UPDATE appeal_requests
      SET 
        status = ${decision},
        reviewed_by = ${user.id},
        admin_notes = ${adminNotes || null},
        reviewed_at = NOW()
      WHERE id = ${appealId}
    `;

        // If approved, unflag the content
        if (decision === 'approved') {
            const { content_type, content_id } = appeal[0];

            if (content_type === 'discussion') {
                await sql`
          UPDATE discussions
          SET is_flagged = false, flag_count = 0
          WHERE id = ${content_id}
        `;
            } else if (content_type === 'discussion_comment') {
                await sql`
          UPDATE discussion_comments
          SET is_flagged = false, flag_count = 0
          WHERE id = ${content_id}
        `;
            } else if (content_type === 'product_comment') {
                await sql`
          UPDATE product_comments
          SET is_flagged = false, flag_count = 0
          WHERE id = ${content_id}
        `;
            } else if (content_type === 'review') {
                await sql`
          UPDATE reviews
          SET is_flagged = false, flag_count = 0
          WHERE id = ${content_id}
        `;
            }
        }

        // Create notification for appellant
        await sql`
      INSERT INTO notifications (user_id, type, target_id, target_type, metadata)
      VALUES (
        ${appeal[0].appellant_id},
        'reply',
        ${appealId}::UUID,
        'profile',
        jsonb_build_object(
          'appeal_decision', ${decision},
          'admin_notes', ${adminNotes || ''}
        )
      )
    `;

        // Log admin action
        await sql`
      INSERT INTO admin_logs (admin_id, action, details)
      VALUES (
        ${user.id},
        'appeal_reviewed',
        jsonb_build_object(
          'appeal_id', ${appealId},
          'decision', ${decision},
          'content_type', ${appeal[0].content_type},
          'content_id', ${appeal[0].content_id}
        )
      )
    `;

        revalidatePath(`/admin`);
        revalidatePath(`/moderation-policy`);

        return { success: true };
    } catch (error) {
        console.error("Error reviewing appeal:", error);
        return { success: false, error: "Failed to review appeal" };
    }
}

/**
 * Update daily moderation metrics (called by cron job)
 */
export async function updateDailyModerationMetrics(): Promise<{ success: boolean }> {
    const sql = getDb();

    try {
        await sql`SELECT update_moderation_metrics()`;
        return { success: true };
    } catch (error) {
        console.error("Error updating moderation metrics:", error);
        return { success: false };
    }
}
