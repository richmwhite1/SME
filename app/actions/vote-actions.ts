"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateInsight } from "@/lib/ai/insight-engine";

export type VoteType = 1 | -1;
export type ResourceType = 'product' | 'discussion' | 'comment' | 'review';

/**
 * Toggle vote (up/down) on a resource
 */
export async function toggleVote(
    resourceId: string,
    resourceType: ResourceType,
    voteType: VoteType,
    path_to_revalidate?: string
) {
    const user = await currentUser();
    if (!user) {
        throw new Error("You must be logged in to vote");
    }

    const sql = getDb();

    try {
        // 1. Check existing vote
        const existingVotes = await sql`
            SELECT id, vote_type FROM votes 
            WHERE user_id = ${user.id} 
              AND resource_id = ${resourceId}
              AND resource_type = ${resourceType}
        `;

        const existingVote = existingVotes[0];
        let newVoteType: VoteType | null = voteType;
        let scoreChange = 0;

        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                // Remove vote (toggle off)
                await sql`DELETE FROM votes WHERE id = ${existingVote.id}`;
                newVoteType = null;
                scoreChange = -voteType;
            } else {
                // Change vote (flip)
                await sql`UPDATE votes SET vote_type = ${voteType} WHERE id = ${existingVote.id}`;
                scoreChange = 2 * voteType; // e.g., -1 to 1 is +2
            }
        } else {
            // New vote
            await sql`
                INSERT INTO votes (user_id, resource_id, resource_type, vote_type)
                VALUES (${user.id}, ${resourceId}, ${resourceType}, ${voteType})
            `;
            scoreChange = voteType;
        }

        // 2. Update the resource's calculated score (upvote_count)
        // Helper to update table
        // We use GREATEST(..., 0) to prevent negative counts if that's the desired behavior, 
        // but for a full up/down system, negatives should be allowed. 
        // However, the column is `upvote_count` (implies >= 0) and historically only upvotes.
        // Let's standardise on allowing it to go up/down but maybe clamp at 0 for now to be safe until UI handles negatives?
        // User request: "Restore Upvote/Downvote Logic".
        // Let's allow negative.

        const updateTable = async (tableName: string) => {
            const result = await sql`
                UPDATE ${sql(tableName)}
                SET upvote_count = upvote_count + ${scoreChange}
                WHERE id = ${resourceId}
                RETURNING upvote_count, content
            `;
            return result;
        };

        let result;
        if (resourceType === 'discussion') {
            result = await updateTable('discussions');
        } else if (resourceType === 'product') {
            result = await updateTable('products');
        } else if (resourceType === 'review') {
            result = await updateTable('reviews');
        } else if (resourceType === 'comment') {
            // Try discussion_comments first
            const dComment = await updateTable('discussion_comments');
            if (dComment.length > 0) {
                result = dComment;
            } else {
                const pComment = await updateTable('product_comments');
                if (pComment.length > 0) result = pComment;
            }
        }

        // If we didn't find the resource to update, ignoring (or could log error)
        // But for generic 'comment' type, it's ambiguous. 
        // Better if client sends 'discussion_comment' or 'product_comment'.
        // For compatibility, I will check if I can modify the specific logic. 

        // Let's try to detect based on ID? No.
        // I will assume for 'comment' type for now we try both or the client updates to send 'discussion_comment'.

        let newScore = 0;

        if (result && result.length > 0) {
            newScore = result[0].upvote_count;

            // Insight Engine Logic
            // Trigger if score >= 5 and new upvote
            if (scoreChange > 0 && newScore >= 5) {
                // Simplified trigger logic
                // If insight generation is needed, we'd add it here.
            }
        }

        if (path_to_revalidate) {
            revalidatePath(path_to_revalidate);
        }

        return { success: true, voteType: newVoteType, score: newScore };

    } catch (error: any) {
        console.error("Error toggling vote:", error);
        return { success: false, error: error.message };
    }
}
