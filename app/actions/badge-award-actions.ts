"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Badge type definition
 */
export interface Badge {
    id: string;
    name: string;
    description: string;
    category: 'contribution' | 'engagement' | 'expertise' | 'milestone' | 'special';
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    criteria: {
        type: string;
        threshold: number;
    };
    points_required?: number;
    is_active: boolean;
}

export interface UserBadge extends Badge {
    earned_at: string;
    progress: number;
}

export interface ReputationTier {
    tier_name: string;
    tier_color: string;
    current_reputation: number;
    next_tier_name: string | null;
    next_tier_threshold: number | null;
    progress_percentage: number;
}

/**
 * Get all available badges in the system
 */
export async function getAllBadges(): Promise<Badge[]> {
    const sql = getDb();

    try {
        const badges = await sql<Badge[]>`
      SELECT 
        id,
        name,
        description,
        category,
        icon,
        rarity,
        criteria,
        points_required,
        is_active
      FROM badges
      WHERE is_active = true
      ORDER BY 
        CASE category
          WHEN 'contribution' THEN 1
          WHEN 'engagement' THEN 2
          WHEN 'expertise' THEN 3
          WHEN 'milestone' THEN 4
          WHEN 'special' THEN 5
        END,
        CASE rarity
          WHEN 'common' THEN 1
          WHEN 'rare' THEN 2
          WHEN 'epic' THEN 3
          WHEN 'legendary' THEN 4
        END
    `;

        return badges;
    } catch (error) {
        console.error("Error fetching badges:", error);
        throw new Error("Failed to fetch badges");
    }
}

/**
 * Get badges earned by a specific user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
    const sql = getDb();

    try {
        const userBadges = await sql<UserBadge[]>`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.category,
        b.icon,
        b.rarity,
        b.criteria,
        b.points_required,
        b.is_active,
        ub.earned_at::TEXT,
        ub.progress
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ${userId}
      ORDER BY ub.earned_at DESC
    `;

        return userBadges;
    } catch (error) {
        console.error("Error fetching user badges:", error);
        throw new Error("Failed to fetch user badges");
    }
}

/**
 * Check all badge criteria and award eligible badges to user
 * Returns array of newly awarded badge IDs
 */
export async function checkAndAwardBadges(userId?: string): Promise<string[]> {
    const user = await currentUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
        throw new Error("User ID required");
    }

    const sql = getDb();

    try {
        const result = await sql<{ newly_awarded_badges: string[] }[]>`
      SELECT check_and_award_badges(${targetUserId}) as newly_awarded_badges
    `;

        const newBadges = result[0]?.newly_awarded_badges || [];

        // Create notifications for newly awarded badges
        if (newBadges.length > 0) {
            for (const badgeId of newBadges) {
                await sql`
          INSERT INTO notifications (user_id, type, target_id, target_type, metadata)
          VALUES (
            ${targetUserId},
            'badge',
            ${badgeId}::UUID,
            'profile',
            jsonb_build_object('badge_id', ${badgeId})
          )
        `;
            }

            // Revalidate user profile
            revalidatePath(`/u`, "page");
            revalidatePath(`/achievements`, "page");
        }

        return newBadges;
    } catch (error) {
        console.error("Error checking and awarding badges:", error);
        throw new Error("Failed to check and award badges");
    }
}

/**
 * Get user's current reputation tier and progress
 */
export async function getReputationTier(userId?: string): Promise<ReputationTier | null> {
    const user = await currentUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
        return null;
    }

    const sql = getDb();

    try {
        const result = await sql<ReputationTier[]>`
      SELECT * FROM get_user_reputation_tier(${targetUserId})
    `;

        return result[0] || null;
    } catch (error) {
        console.error("Error fetching reputation tier:", error);
        throw new Error("Failed to fetch reputation tier");
    }
}

/**
 * Get badge progress for a specific badge
 */
export async function getBadgeProgress(
    userId: string,
    badgeId: string
): Promise<{ current: number; required: number; percentage: number } | null> {
    const sql = getDb();

    try {
        // Get badge criteria
        const badge = await sql<Badge[]>`
      SELECT criteria FROM badges WHERE id = ${badgeId}
    `;

        if (!badge[0]) {
            return null;
        }

        const criteria = badge[0].criteria;
        const required = criteria.threshold;
        let current = 0;

        // Calculate current progress based on criteria type
        switch (criteria.type) {
            case 'discussions_created':
                const discussions = await sql`
          SELECT COUNT(*)::INTEGER as count
          FROM discussions
          WHERE author_id = ${userId}
        `;
                current = discussions[0]?.count || 0;
                break;

            case 'comments_posted':
                const comments = await sql`
          SELECT COUNT(*)::INTEGER as count
          FROM (
            SELECT id FROM discussion_comments WHERE author_id = ${userId}
            UNION ALL
            SELECT id FROM product_comments WHERE user_id = ${userId}
          ) AS all_comments
        `;
                current = comments[0]?.count || 0;
                break;

            case 'upvotes_received':
                const profile = await sql`
          SELECT contributor_score
          FROM profiles
          WHERE id = ${userId}
        `;
                current = profile[0]?.contributor_score || 0;
                break;

            case 'product_reviews':
                const reviews = await sql`
          SELECT COUNT(*)::INTEGER as count
          FROM reviews
          WHERE user_id = ${userId}
        `;
                current = reviews[0]?.count || 0;
                break;

            case 'account_age_days':
                const accountAge = await sql`
          SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER as days
          FROM profiles
          WHERE id = ${userId}
        `;
                current = accountAge[0]?.days || 0;
                break;
        }

        const percentage = Math.min(Math.round((current / required) * 100), 100);

        return {
            current,
            required,
            percentage
        };
    } catch (error) {
        console.error("Error fetching badge progress:", error);
        return null;
    }
}

/**
 * Get badge statistics (for admin dashboard)
 */
export async function getBadgeStats() {
    const user = await currentUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    const sql = getDb();

    try {
        const stats = await sql`
      SELECT 
        b.id,
        b.name,
        b.rarity,
        COUNT(ub.id)::INTEGER as earned_count,
        ROUND((COUNT(ub.id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM profiles), 0) * 100), 2) as earn_rate
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id
      WHERE b.is_active = true
      GROUP BY b.id, b.name, b.rarity
      ORDER BY earned_count DESC
    `;

        return stats;
    } catch (error) {
        console.error("Error fetching badge stats:", error);
        throw new Error("Failed to fetch badge statistics");
    }
}

/**
 * Manually award a badge to a user (admin only)
 */
export async function manuallyAwardBadge(userId: string, badgeId: string) {
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
        // Check if user already has badge
        const existing = await sql`
      SELECT id FROM user_badges
      WHERE user_id = ${userId} AND badge_id = ${badgeId}
    `;

        if (existing.length > 0) {
            throw new Error("User already has this badge");
        }

        // Award badge
        await sql`
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (${userId}, ${badgeId})
    `;

        // Create notification
        await sql`
      INSERT INTO notifications (user_id, type, target_id, target_type, metadata)
      VALUES (
        ${userId},
        'badge',
        ${badgeId}::UUID,
        'profile',
        jsonb_build_object('badge_id', ${badgeId}, 'manually_awarded', true)
      )
    `;

        // Log admin action
        await sql`
      INSERT INTO admin_logs (admin_id, action, details)
      VALUES (
        ${user.id},
        'badge_awarded',
        jsonb_build_object('user_id', ${userId}, 'badge_id', ${badgeId})
      )
    `;

        revalidatePath(`/u`, "page");
        revalidatePath(`/achievements`, "page");

        return { success: true };
    } catch (error) {
        console.error("Error manually awarding badge:", error);
        throw error;
    }
}
