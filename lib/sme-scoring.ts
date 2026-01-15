/**
 * SME Scoring System
 * 
 * Handles the calculation of SME scores and Chakra levels based on user contributions.
 */

import { getDb } from './db';
import { SME_PILLARS, CHAKRA_LEVELS, POINTS, getChakraLevel, getNextChakraLevel } from './sme-constants';

// Re-export for backward compatibility
export { SME_PILLARS, CHAKRA_LEVELS, POINTS, getChakraLevel, getNextChakraLevel };

/**
 * Calculate SME Score for a specific user
 * This function aggregates all contributions and calculates the total score.
 * It does NOT update the database unless updateDb is true.
 */
export async function calculateSMEScore(userId: string, updateDb = false) {
    const sql = getDb();

    try {
        // 1. Get Counts
        const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM discussions WHERE author_id = ${userId}) as discussion_count,
        (SELECT COUNT(*) FROM discussion_comments WHERE author_id = ${userId}) as discussion_comment_count,
        (SELECT COUNT(*) FROM product_comments WHERE author_id = ${userId}) as product_comment_count,
        (SELECT COUNT(*) FROM reviews WHERE user_id = ${userId}) as review_count,
        (SELECT is_verified_expert FROM profiles WHERE id = ${userId}) as is_expert
    `;

        const { discussion_count, discussion_comment_count, product_comment_count, review_count, is_expert } = counts[0];

        // 2. Get Upvotes Received (aggregating from different tables)
        // Note: This matches schema.sql indexes for performance
        const upvotes = await sql`
      WITH user_content AS (
        SELECT id FROM discussions WHERE author_id = ${userId}
        UNION ALL
        SELECT id FROM discussion_comments WHERE author_id = ${userId}
        UNION ALL
        SELECT id FROM product_comments WHERE user_id = ${userId}
      )
      SELECT 
        COALESCE(SUM(d.upvote_count), 0) as total_upvotes 
      FROM discussions d WHERE author_id = ${userId}
      -- simplified for now, ideally we sum upvotes from all content types
    `;

        // For MVP efficiency, we might rely on the 'contributor_score' or sum counts if cached.
        // However, to be accurate, let's calculate raw points.

        let score = 0;
        const details: any = {};

        // Contribution Points
        details.discussions = parseInt(discussion_count) * POINTS.CREATE_DISCUSSION;
        details.comments = (parseInt(discussion_comment_count) + parseInt(product_comment_count)) * POINTS.CREATE_COMMENT;
        details.reviews = parseInt(review_count) * POINTS.CREATE_REVIEW;

        // Bonus
        details.expert_bonus = is_expert ? POINTS.VERIFIED_EXPERT_BONUS : 0;

        // Calculate Total
        score = details.discussions + details.comments + details.reviews + details.expert_bonus;

        // Determine Level
        const chakra = getChakraLevel(score);

        const result = {
            userId,
            score,
            level: chakra.level,
            levelName: chakra.name,
            details
        };

        if (updateDb) {
            await sql`
        UPDATE profiles 
        SET 
          sme_score = ${score},
          chakra_level = ${chakra.level},
          sme_score_details = ${sql.json(details)},
          last_score_update = NOW()
        WHERE id = ${userId}
      `;
        }

        return result;

    } catch (error) {
        console.error(`Error calculating SME score for user ${userId}:`, error);
        throw error;
    }
}
