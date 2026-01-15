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
 * Calculate Time Decay Factor
 * Formula: Value = Base - (0.5 * Months)
 * Minimum value is 0
 */
function applyTimeDecay(basePoints: number, createdAt: Date): number {
  const now = new Date();
  const created = new Date(createdAt);

  // Difference in months
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month

  const decay = diffMonths * 0.5;
  const finalPoints = Math.max(0, basePoints - decay);

  return parseFloat(finalPoints.toFixed(2));
}

/**
 * Normalize tags to Pillars
 */
function identifyPillars(tags: string[] | null): string[] {
  if (!tags || !Array.isArray(tags)) return [];

  const normalizedTags = tags.map(t => t.toLowerCase());
  return SME_PILLARS.filter(pillar =>
    normalizedTags.includes(pillar.toLowerCase())
  ) as string[]; // Cast to string[] to satisfy TS
}

/**
 * Calculate SME Score for a specific user
 * - Fetches full history for Time Decay calculation
 * - Calculates effective WCS Score
 * - Determines Pillar Expertise
 * - Updates DB if requested
 */
export async function calculateSMEScore(userId: string, updateDb = false) {
  const sql = getDb();

  try {
    // 1. Fetch All Contributions with Dates and Metadata
    // We need to join with products/discussions to get tags for pillar categorization

    // Discussions
    const discussions = await sql`
            SELECT id, created_at, tags FROM discussions WHERE author_id = ${userId}
        `;

    // Comments (Discussion)
    const discussionComments = await sql`
            SELECT dc.id, dc.created_at, d.tags 
            FROM discussion_comments dc
            LEFT JOIN discussions d ON dc.discussion_id = d.id
            WHERE dc.author_id = ${userId}
        `;

    // Comments (Product)
    const productComments = await sql`
            SELECT pc.id, pc.created_at, p.tags 
            FROM product_comments pc
            LEFT JOIN products p ON pc.product_id = p.id
            WHERE pc.author_id = ${userId}
        `;

    // Upvotes Received (on Discussions)
    const upvotesReceived = await sql`
        SELECT dv.created_at, d.tags
        FROM discussion_votes dv
        JOIN discussions d ON dv.discussion_id = d.id
        WHERE d.author_id = ${userId}
    `;

    // Reviews
    const reviews = await sql`
            SELECT r.id, r.created_at, p.tags 
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            WHERE r.user_id = ${userId}
        `;

    // Get User Profile for Bonus check
    const profile = await sql`SELECT is_verified_expert FROM profiles WHERE id = ${userId}`;
    const isExpert = profile[0]?.is_verified_expert || false;

    // 2. Calculate Scores
    let totalScore = 0;
    const pillarScores: Record<string, number> = {};
    const scoreDetails: any = {
      base_points: 0,
      decay_penalty: 0,
      breakdown: {
        discussions: 0,
        comments: 0,
        reviews: 0,
        citations: 0,
        upvotes: 0, // NEW: Track upvotes
        bonus: 0
      }
    };

    // Helper to process items
    const processItem = (item: any, basePoints: number, type: string) => {
      const effectivePoints = applyTimeDecay(basePoints, item.created_at);
      const decayAmount = basePoints - effectivePoints;


      totalScore += effectivePoints;

      // Track details
      // ...
      scoreDetails.base_points += basePoints;
      scoreDetails.decay_penalty += decayAmount;
      if (scoreDetails.breakdown[type] !== undefined) {
        scoreDetails.breakdown[type] += effectivePoints;
      }

      // Pillar Attribution
      const pillars = identifyPillars(item.tags);
      pillars.forEach(p => {
        pillarScores[p] = (pillarScores[p] || 0) + effectivePoints;
      });
    };

    // Process all lists
    discussions.forEach(d => processItem(d, 20, 'discussions'));
    discussionComments.forEach(c => processItem(c, POINTS.COMMENT, 'comments'));
    productComments.forEach(c => processItem(c, POINTS.COMMENT, 'comments'));
    reviews.forEach(r => processItem(r, POINTS.REVIEW, 'reviews'));

    // Process Upvotes
    upvotesReceived.forEach(u => processItem(u, POINTS.UPVOTE_RECEIVED || 2, 'upvotes'));

    // Bonus
    if (isExpert) {
      totalScore += POINTS.VERIFIED_EXPERT_BONUS;
      scoreDetails.breakdown.bonus = POINTS.VERIFIED_EXPERT_BONUS;
    }

    // Round Score
    totalScore = parseFloat(totalScore.toFixed(2));

    // 3. Determine Pillars with Expertise
    const gainedExpertise = Object.entries(pillarScores)
      .filter(([_, score]) => score >= POINTS.PILLAR_EXPERTISE_THRESHOLD)
      .map(([pillar]) => pillar);

    // 4. Determine Level
    const chakra = getChakraLevel(totalScore);

    const result = {
      userId,
      score: totalScore,
      level: chakra.level,
      levelName: chakra.name,
      details: scoreDetails,
      pillarScores,
      gainedExpertise
    };

    if (updateDb) {
      // Update DB with new scores and potentially new pillars
      // We append gained knowledge to existing? Or just overwrite?
      // "Develop a mechanism to grant... status".
      // Typically this is cumulative. 
      // I should fetch existing pillars, merge, and save.

      // However, the prompt implies "Automatic". If I lose points, do I lose expertise?
      // "Revocation/Downgrade" mentioned for Levels. maybe for Pillars too?
      // If strictly "based on WCS from contributions > threshold", then it should be calculated fresh.
      // So overwriting is safer for "Self-Regulating". 
      // If I decay below 500, I lose it? Yes, "Self-regulating".

      await sql`
                UPDATE profiles 
                SET 
                  sme_score = ${totalScore},
                  chakra_level = ${chakra.level},
                  sme_score_details = ${sql.json(scoreDetails)},
                  pillar_expertise = ${sql.json(gainedExpertise)},
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
