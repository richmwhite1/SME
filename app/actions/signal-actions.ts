"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions/notifications";

/**
 * Toggle "Raise Hand" signal on a comment
 */
export async function toggleCommentSignal(
    commentId: string,
    commentType: 'discussion' | 'product',
    path_to_revalidate?: string
) {
    const user = await currentUser();
    if (!user) {
        throw new Error("You must be logged in to raise your hand");
    }

    const sql = getDb();
    const signalType = 'raise_hand';

    try {
        // Check for existing signal
        // We check based on the target column for the specific type
        const existingSignal = await sql`
            SELECT id FROM comment_signals
            WHERE user_id = ${user.id}
            AND (
                (${commentType} = 'product' AND product_comment_id = ${commentId})
                OR
                (${commentType} = 'discussion' AND discussion_comment_id = ${commentId})
            )
            AND signal_type = ${signalType}
        `;

        let newSignalCount = 0;
        let isSignaled = false;

        if (existingSignal.length > 0) {
            // Remove signal
            await sql`
                DELETE FROM comment_signals
                WHERE id = ${existingSignal[0].id}
            `;

            // Decrement count
            if (commentType === 'discussion') {
                const result = await sql`
                    UPDATE discussion_comments
                    SET raise_hand_count = GREATEST(raise_hand_count - 1, 0)
                    WHERE id = ${commentId}
                    RETURNING raise_hand_count
                `;
                newSignalCount = result[0]?.raise_hand_count ?? 0;
            } else {
                const result = await sql`
                    UPDATE product_comments
                    SET raise_hand_count = GREATEST(raise_hand_count - 1, 0)
                    WHERE id = ${commentId}
                    RETURNING raise_hand_count
                `;
                newSignalCount = result[0]?.raise_hand_count ?? 0;
            }
            isSignaled = false;
        } else {
            // Add signal
            if (commentType === 'discussion') {
                await sql`
                    INSERT INTO comment_signals (user_id, discussion_comment_id, signal_type)
                    VALUES (${user.id}, ${commentId}, ${signalType})
                `;
                const result = await sql`
                    UPDATE discussion_comments
                    SET raise_hand_count = raise_hand_count + 1
                    WHERE id = ${commentId}
                    RETURNING raise_hand_count
                `;
                newSignalCount = result[0]?.raise_hand_count ?? 0;
            } else {
                await sql`
                    INSERT INTO comment_signals (user_id, product_comment_id, signal_type)
                    VALUES (${user.id}, ${commentId}, ${signalType})
                `;
                const result = await sql`
                    UPDATE product_comments
                    SET raise_hand_count = raise_hand_count + 1
                    WHERE id = ${commentId}
                    RETURNING raise_hand_count
                `;
                newSignalCount = result[0]?.raise_hand_count ?? 0;
            }
            isSignaled = true;

            // Priority Ranking Logic
            // 5 hands = "Trending Signal"
            // 10+ hands = "Urgent SME Request"

            if (newSignalCount === 5) {
                console.log(`[TRENDING] ${commentType} ${commentId} has reached 5 signals.`);
                // In a future update, we could add this to a "Trending" collection or dashboard view.
                // For now, the count itself drives the sorting in the UI.
            }

            if (newSignalCount >= 10) {
                console.log(`[URGENT] ${commentType} ${commentId} has reached ${newSignalCount} signals. Notifying experts.`);

                // Fetch valid experts to notify (simplification: notify all verified experts for now, or just admins)
                // Ideally, we would filter by category tags matching the discussion/product.
                try {
                    const experts = await sql`
                        SELECT id FROM profiles 
                        WHERE is_verified_expert = true 
                        LIMIT 10
                    `;

                    if (experts.length > 0) {
                        const notificationTitle = "Urgent SME Request";
                        const notificationMessage = "A community signal has reached critical mass (10+). Your expertise is requested.";
                        // Determine link
                        let link = `/`;
                        if (commentType === 'discussion') {
                            // We need logic to getting the slug, but ID works if we have a route handler for /discussions/[id], 
                            // currently we use slugs. simpler to just point to /discussions for now if we don't have the slug handy.
                            // But wait, we can just use the ID if we implemented ID-based routing or redirect. 
                            // The createDiscussionComment revalidates /discussions/[slug].
                            // Let's trying fetching the slug to be precise.
                            const dResult = await sql`
                                SELECT d.slug FROM discussion_comments dc 
                                JOIN discussions d ON dc.discussion_id = d.id 
                                WHERE dc.id = ${commentId}
                            `;
                            if (dResult[0]?.slug) {
                                link = `/discussions/${dResult[0].slug}?commentId=${commentId}`;
                            }
                        } else {
                            // Product comment
                            const pResult = await sql`
                                SELECT p.slug FROM product_comments pc 
                                JOIN products p ON pc.product_id = p.id 
                                WHERE pc.id = ${commentId}
                            `;
                            if (pResult[0]?.slug) {
                                link = `/products/${pResult[0].slug}?commentId=${commentId}`;
                            }
                        }

                        await Promise.all(experts.map((exp: any) =>
                            createNotification(
                                exp.id,
                                notificationTitle,
                                notificationMessage,
                                'warning',
                                link
                            )
                        ));
                    }
                } catch (notifyError) {
                    console.error("Error notifying experts:", notifyError);
                }
            }
        }

        if (path_to_revalidate) {
            revalidatePath(path_to_revalidate);
        }

        return { success: true, isSignaled, signalCount: newSignalCount };
    } catch (error: any) {
        console.error("Error toggling signal:", error);
        return { success: false, error: error.message };
    }
}
