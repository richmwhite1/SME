"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateInsight } from "@/lib/ai/insight-engine";

/**
 * Toggle upvote on a comment
 * Triggers insight generation if upvotes reach threshold
 */
export async function toggleCommentVote(
    commentId: string,
    commentType: 'discussion' | 'product' | 'review',
    path_to_revalidate?: string
) {
    const user = await currentUser();
    if (!user) {
        throw new Error("You must be logged in to vote");
    }

    const sql = getDb();

    // Determine table name based on type
    let table = 'discussion_comments';
    if (commentType === 'product') table = 'product_comments';
    if (commentType === 'review') table = 'reviews';

    try {
        // Check if vote exists
        const existingVote = await sql`
      SELECT id FROM comment_votes
      WHERE user_id = ${user.id} 
        AND comment_id = ${commentId}
        AND comment_type = ${commentType}
    `;

        let newUpvoteCount = 0;
        let isUpvoted = false;

        if (existingVote.length > 0) {
            // Remove vote
            await sql`
        DELETE FROM comment_votes
        WHERE id = ${existingVote[0].id}
      `;

            // Decrement count in appropriate table
            if (commentType === 'discussion') {
                const result = await sql`
          UPDATE discussion_comments
          SET upvote_count = GREATEST(upvote_count - 1, 0)
          WHERE id = ${commentId}
          RETURNING upvote_count
        `;
                newUpvoteCount = result[0]?.upvote_count ?? 0;
            } else if (commentType === 'product') {
                const result = await sql`
          UPDATE product_comments
          SET upvote_count = GREATEST(upvote_count - 1, 0)
          WHERE id = ${commentId}
          RETURNING upvote_count
        `;
                newUpvoteCount = result[0]?.upvote_count ?? 0;
            } else if (commentType === 'review') {
                const result = await sql`
          UPDATE reviews
          SET upvote_count = GREATEST(upvote_count - 1, 0)
          WHERE id = ${commentId}
          RETURNING upvote_count
        `;
                newUpvoteCount = result[0]?.upvote_count ?? 0;
            }

            isUpvoted = false;
        } else {
            // Add vote
            await sql`
        INSERT INTO comment_votes (user_id, comment_id, comment_type)
        VALUES (${user.id}, ${commentId}, ${commentType})
      `;

            // Increment count
            let comment;
            if (commentType === 'discussion') {
                const result = await sql`
          UPDATE discussion_comments
          SET upvote_count = upvote_count + 1
          WHERE id = ${commentId}
          RETURNING upvote_count, content, insight_summary
        `;
                comment = result[0];
            } else if (commentType === 'product') {
                const result = await sql`
          UPDATE product_comments
          SET upvote_count = upvote_count + 1
          WHERE id = ${commentId}
          RETURNING upvote_count, content, insight_summary
        `;
                comment = result[0];
            } else if (commentType === 'review') {
                const result = await sql`
          UPDATE reviews
          SET upvote_count = upvote_count + 1
          WHERE id = ${commentId}
          RETURNING upvote_count, content, NULL as insight_summary
        `;
                // Reviews might specifically lack insight_summary - verify if needed?
                // For now, assuming reviews don't trigger insight generation in the same way or simplified.
                // Assuming reviews table *doesn't* have insight_summary column unless I check?
                // Check schema: reviews has id, rating, content... NO insight_summary. 
                // So returning NULL alias is safe.
                comment = { ...result[0], insight_summary: null };
            }

            if (!comment) {
                throw new Error("Target content not found");
            }

            newUpvoteCount = comment?.upvote_count ?? 0;
            isUpvoted = true;

            // Trigger Insight Generator if threshold reached (Gate B)
            // (Only for discussions/products for now as reviews don't have insight_summary column usually)
            // But if we want it for reviews, we'd need to add the column. 
            // The code below checks `!comment.insight_summary`. Since I return NULL for review, it evaluates true.
            // But checking `comment.content` is fine.
            // Wait, if I return null for insight_summary, `!null` is true. `!undefined` is true.
            // So logic `!comment.insight_summary` is effectively true for reviews.
            // But we can't SAVE it because reviews table lacks the column.

            if (commentType !== 'review' && newUpvoteCount >= 5 && !comment.insight_summary && comment.content?.length > 50) {
                // ... insight generation logic (which updates table) ...
                // Kept logic same but wrapped in check.
                // Actually I'll just conditionally execute the insight block.

                console.log(`Triggering Insight Engine for ${commentType} comment ${commentId} (Upvotes: ${newUpvoteCount})`);

                try {
                    const insight = await generateInsight(comment.content);
                    if (insight) {
                        if (commentType === 'discussion') {
                            await sql`
                UPDATE discussion_comments
                SET insight_summary = ${insight}
                WHERE id = ${commentId}
              `;
                        } else if (commentType === 'product') {
                            await sql`
                UPDATE product_comments
                SET insight_summary = ${insight}
                WHERE id = ${commentId}
              `;
                        }
                        console.log("Insight generated and saved successfully");
                    }
                } catch (err) {
                    console.error("Background insight generation failed:", err);
                }
            }
        }

        if (path_to_revalidate) {
            revalidatePath(path_to_revalidate);
        }

        return { success: true, isUpvoted, upvoteCount: newUpvoteCount };
    } catch (error: any) {
        console.error("Error toggling vote:", error);
        return { success: false, error: error.message };
    }
}
