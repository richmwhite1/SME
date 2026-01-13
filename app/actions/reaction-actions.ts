"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { recalculateUserReputation } from "./reputation-actions";
import { revalidatePath } from "next/cache";

export type ReactionType = 'scientific' | 'experiential' | 'safety' | 'innovation' | 'reliability';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
    scientific: '🔬',
    experiential: '💡',
    safety: '⚠️',
    innovation: '💎',
    reliability: '✅'
};

export const REACTION_LABELS: Record<ReactionType, string> = {
    scientific: 'Scientific Insight',
    experiential: 'Experiential Wisdom',
    safety: 'Potential Concern',
    innovation: 'Groundbreaking Idea',
    reliability: 'Tried and True'
};

/**
 * Toggle a reaction on a comment (discussion or product)
 */
export async function toggleReaction(
    commentId: string,
    commentType: 'discussion' | 'product',
    reactionType: ReactionType
) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    const sql = getDb();

    try {
        const table = commentType === 'discussion'
            ? 'discussion_comment_reactions'
            : 'product_comment_reactions';

        // Check if reaction exists
        const existing = await sql.unsafe(`
            SELECT id FROM ${table}
            WHERE user_id = $1 AND comment_id = $2 AND reaction_type = $3
        `, [user.id, commentId, reactionType]);

        let action: 'added' | 'removed';

        if (existing.length > 0) {
            // Remove reaction
            await sql.unsafe(`
                DELETE FROM ${table}
                WHERE user_id = $1 AND comment_id = $2 AND reaction_type = $3
            `, [user.id, commentId, reactionType]);
            action = 'removed';
        } else {
            // Add reaction
            await sql.unsafe(`
                INSERT INTO ${table} (user_id, comment_id, reaction_type)
                VALUES ($1, $2, $3)
            `, [user.id, commentId, reactionType]);
            action = 'added';
        }

        // Trigger reputation update for the comment author
        // First get the author ID
        const commentTable = commentType === 'discussion' ? 'discussion_comments' : 'product_comments';
        const authorQuery = await sql.unsafe(`
            SELECT ${commentType === 'discussion' ? 'author_id' : 'user_id'} as author_id
            FROM ${commentTable}
            WHERE id = $1
        `, [commentId]);

        if (authorQuery.length > 0) {
            const authorId = authorQuery[0].author_id;
            // We don't await this to keep UI responsive? 
            // Actually better to await to ensure consistency or rely on trigger/queue if we implemented one.
            // Our DB function logic has recalculate_and_update_reputation which we can call.
            // But let's use the exported action which is safer.
            await recalculateUserReputation(authorId);
        }

        // Revalidate paths - difficult to know exact path, so we might need client to refresh or optimistic updates.
        // For now we return success and client updates state.

        return { success: true, action };

    } catch (error: any) {
        console.error("Error toggling reaction:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get reactions for a specific comment
 */
export async function getCommentReactions(
    commentId: string,
    commentType: 'discussion' | 'product'
) {
    const user = await currentUser();
    const sql = getDb();
    const currentUserId = user?.id;

    try {
        const table = commentType === 'discussion'
            ? 'discussion_comment_reactions'
            : 'product_comment_reactions';

        // Get counts and user status
        // We want to return an array of { type: ReactionType, count: number, userReated: boolean }

        const results = await sql.unsafe(`
            SELECT 
                reaction_type,
                COUNT(*)::int as count,
                BOOL_OR(user_id = $1) as user_reacted
            FROM ${table}
            WHERE comment_id = $2
            GROUP BY reaction_type
        `, [currentUserId || 'NO_USER', commentId]);

        // Format results to always include all types? Or just returned ones?
        // UI expects all types usually.

        const reactionsMap = new Map();
        results.forEach((r: any) => {
            reactionsMap.set(r.reaction_type, {
                count: r.count,
                user_reacted: r.user_reacted || false
            });
        });

        const formattedReactions = Object.keys(REACTION_EMOJIS).map(type => {
            const data = reactionsMap.get(type) || { count: 0, user_reacted: false };
            return {
                reaction_type: type as ReactionType,
                emoji: REACTION_EMOJIS[type as ReactionType],
                label: REACTION_LABELS[type as ReactionType],
                count: data.count,
                user_reacted: data.user_reacted
            };
        });

        return { success: true, data: formattedReactions };

    } catch (error: any) {
        console.error("Error fetching reactions:", error);
        return { success: false, error: error.message };
    }
}
