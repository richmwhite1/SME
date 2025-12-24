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
    commentType: 'discussion' | 'product',
    path_to_revalidate?: string
) {
    const user = await currentUser();
    if (!user) {
        throw new Error("You must be logged in to vote");
    }

    const sql = getDb();
    const table = commentType === 'discussion' ? 'discussion_comments' : 'product_comments';

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

            // Decrement count in comment table
            // Use dynamic table name in query builder if possible, but for raw SQL we handle safely
            if (commentType === 'discussion') {
                const result = await sql`
          UPDATE discussion_comments
          SET upvote_count = GREATEST(upvote_count - 1, 0)
          WHERE id = ${commentId}
          RETURNING upvote_count
        `;
                newUpvoteCount = result[0]?.upvote_count ?? 0;
            } else {
                const result = await sql`
          UPDATE product_comments
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
            } else {
                const result = await sql`
          UPDATE product_comments
          SET upvote_count = upvote_count + 1
          WHERE id = ${commentId}
          RETURNING upvote_count, content, insight_summary
        `;
                comment = result[0];
            }

            newUpvoteCount = comment?.upvote_count ?? 0;
            isUpvoted = true;

            // Trigger Insight Generator if threshold reached (Gate B)
            // Threshold is 5 upvotes, and only if no insight exists yet and content is long enough
            if (newUpvoteCount >= 5 && !comment.insight_summary && comment.content.length > 50) {
                console.log(`Triggering Insight Engine for ${commentType} comment ${commentId} (Upvotes: ${newUpvoteCount})`);

                // Run asynchronously - don't block the UI response
                // In Vercel serverless, this might be cut off, but for quick OpenAI calls it often works.
                // Ideally use a queue, but for this implementation we'll try direct await or fire-and-forget.
                // We'll await it to ensure it runs, but this adds latency to the vote. 
                // Given the requirement "Near Real-Time", this is acceptable.

                try {
                    const insight = await generateInsight(comment.content);
                    if (insight) {
                        if (commentType === 'discussion') {
                            await sql`
                UPDATE discussion_comments
                SET insight_summary = ${insight}
                WHERE id = ${commentId}
              `;
                        } else {
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
