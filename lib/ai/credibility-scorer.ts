import { getDb } from '../db/server';

/**
 * Credibility Scorer
 * Calculates credibility scores for content moderation prioritization
 */

export interface CredibilityScore {
    score: number; // 0-100
    factors: {
        smeStatus: boolean;
        reputationScore: number;
        verifiedProduct: boolean;
        communityUpvotes: number;
    };
    moderationPriority: 'high' | 'medium' | 'low';
    tier: 'sme' | 'trusted' | 'community' | 'guest';
}

/**
 * Calculate credibility score for a user and optional product
 */
export async function calculateCredibility(
    userId?: string,
    productId?: string
): Promise<CredibilityScore> {
    const db = getDb();

    // Default for guests
    if (!userId) {
        return {
            score: 0,
            factors: {
                smeStatus: false,
                reputationScore: 0,
                verifiedProduct: false,
                communityUpvotes: 0,
            },
            moderationPriority: 'low',
            tier: 'guest',
        };
    }

    try {
        // Fetch user profile
        const [profile] = await db`
      SELECT 
        reputation_score,
        is_sme,
        is_verified_expert
      FROM profiles
      WHERE id = ${userId}
    `;

        if (!profile) {
            // User not found, treat as guest
            return {
                score: 0,
                factors: {
                    smeStatus: false,
                    reputationScore: 0,
                    verifiedProduct: false,
                    communityUpvotes: 0,
                },
                moderationPriority: 'low',
                tier: 'guest',
            };
        }

        // Fetch product verification status if productId provided
        let isVerifiedProduct = false;
        if (productId) {
            const [product] = await db`
        SELECT is_sme_certified
        FROM products
        WHERE id = ${productId}
      `;
            isVerifiedProduct = product?.is_sme_certified || false;
        }

        // Fetch user's total upvotes across all content
        const [upvoteStats] = await db`
      SELECT 
        COALESCE(SUM(dc.upvote_count), 0) + 
        COALESCE(SUM(pc.upvote_count), 0) + 
        COALESCE(SUM(d.upvote_count), 0) as total_upvotes
      FROM profiles p
      LEFT JOIN discussion_comments dc ON dc.author_id = p.id
      LEFT JOIN product_comments pc ON pc.user_id = p.id
      LEFT JOIN discussions d ON d.author_id = p.id
      WHERE p.id = ${userId}
    `;

        const totalUpvotes = parseInt(upvoteStats?.total_upvotes || '0');
        const reputationScore = profile.reputation_score || 0;
        const isSme = profile.is_sme || profile.is_verified_expert || false;

        // Calculate credibility score (0-100)
        let score = 0;

        // SME status: +50 points
        if (isSme) {
            score += 50;
        }

        // Reputation score: up to 30 points (capped at 300 reputation)
        score += Math.min(30, (reputationScore / 300) * 30);

        // Community upvotes: up to 15 points (capped at 100 upvotes)
        score += Math.min(15, (totalUpvotes / 100) * 15);

        // Verified product context: +5 points
        if (isVerifiedProduct) {
            score += 5;
        }

        // Determine tier
        let tier: CredibilityScore['tier'];
        if (isSme) {
            tier = 'sme';
        } else if (reputationScore >= 50) {
            tier = 'trusted';
        } else if (reputationScore > 0) {
            tier = 'community';
        } else {
            tier = 'guest';
        }

        // Determine moderation priority
        let moderationPriority: CredibilityScore['moderationPriority'];
        if (score >= 60) {
            moderationPriority = 'low'; // High credibility = low moderation scrutiny
        } else if (score >= 30) {
            moderationPriority = 'medium';
        } else {
            moderationPriority = 'high'; // Low credibility = high moderation scrutiny
        }

        return {
            score: Math.round(score),
            factors: {
                smeStatus: isSme,
                reputationScore,
                verifiedProduct: isVerifiedProduct,
                communityUpvotes: totalUpvotes,
            },
            moderationPriority,
            tier,
        };
    } catch (error) {
        console.error('Error calculating credibility:', error);
        // Return safe default on error
        return {
            score: 0,
            factors: {
                smeStatus: false,
                reputationScore: 0,
                verifiedProduct: false,
                communityUpvotes: 0,
            },
            moderationPriority: 'high',
            tier: 'guest',
        };
    }
}

/**
 * Get credibility context for moderation
 */
export async function getCredibilityContext(
    userId?: string,
    productId?: string
): Promise<{
    isSme: boolean;
    userReputation: number;
    isVerifiedProduct: boolean;
}> {
    const credibility = await calculateCredibility(userId, productId);

    return {
        isSme: credibility.factors.smeStatus,
        userReputation: credibility.factors.reputationScore,
        isVerifiedProduct: credibility.factors.verifiedProduct,
    };
}
