'use server';

import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface SMEReviewData {
    purity?: number | null;
    bioavailability?: number | null;
    potency?: number | null;
    evidence?: number | null;
    sustainability?: number | null;
    experience?: number | null;
    safety?: number | null;
    transparency?: number | null;
    synergy?: number | null;
    expert_summary?: string;
}

export interface SMEReview extends SMEReviewData {
    id: string;
    product_id: string;
    sme_id: string;
    created_at: string;
    updated_at: string;
    sme_profile?: {
        id: string;
        full_name: string;
        username: string;
        avatar_url: string;
        credentials: string;
        badge_type: string;
        profession: string;
    };
}

/**
 * Submit or update an SME review for a product
 */
export async function submitSMEReview(
    productId: string,
    reviewData: SMEReviewData
): Promise<{ success: boolean; error?: string; review?: SMEReview }> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const sql = getDb();

        // Check if user is an SME
        const userCheck = await sql`
      SELECT is_sme, full_name
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

        if (!userCheck || userCheck.length === 0) {
            return { success: false, error: 'User profile not found' };
        }

        if (!userCheck[0].is_sme) {
            return { success: false, error: 'Only SMEs can submit expert audits' };
        }

        // Validate product exists
        const productCheck = await sql`
      SELECT id FROM products WHERE id::text = ${productId} LIMIT 1
    `;

        if (!productCheck || productCheck.length === 0) {
            return { success: false, error: 'Product not found' };
        }

        // Validate pillar scores (0-10 or null)
        const pillars = [
            'purity', 'bioavailability', 'potency', 'evidence',
            'sustainability', 'experience', 'safety', 'transparency', 'synergy'
        ];

        for (const pillar of pillars) {
            const value = reviewData[pillar as keyof SMEReviewData];
            if (typeof value === 'number' && (value < 0 || value > 10)) {
                return { success: false, error: `Invalid ${pillar} score. Must be 0-10 or null.` };
            }
        }

        // Convert 0 values to null (for N/A display)
        const cleanedData = {
            purity: reviewData.purity === 0 ? null : reviewData.purity,
            bioavailability: reviewData.bioavailability === 0 ? null : reviewData.bioavailability,
            potency: reviewData.potency === 0 ? null : reviewData.potency,
            evidence: reviewData.evidence === 0 ? null : reviewData.evidence,
            sustainability: reviewData.sustainability === 0 ? null : reviewData.sustainability,
            experience: reviewData.experience === 0 ? null : reviewData.experience,
            safety: reviewData.safety === 0 ? null : reviewData.safety,
            transparency: reviewData.transparency === 0 ? null : reviewData.transparency,
            synergy: reviewData.synergy === 0 ? null : reviewData.synergy,
            expert_summary: reviewData.expert_summary || null,
        };

        // Insert or update review
        const result = await sql`
      INSERT INTO sme_reviews (
        product_id, sme_id,
        purity, bioavailability, potency, evidence,
        sustainability, experience, safety, transparency, synergy,
        expert_summary
      )
      VALUES (
        ${productId}::uuid, ${userId},
        ${cleanedData.purity}, ${cleanedData.bioavailability}, ${cleanedData.potency}, ${cleanedData.evidence},
        ${cleanedData.sustainability}, ${cleanedData.experience}, ${cleanedData.safety}, ${cleanedData.transparency}, ${cleanedData.synergy},
        ${cleanedData.expert_summary}
      )
      ON CONFLICT (sme_id, product_id)
      DO UPDATE SET
        purity = EXCLUDED.purity,
        bioavailability = EXCLUDED.bioavailability,
        potency = EXCLUDED.potency,
        evidence = EXCLUDED.evidence,
        sustainability = EXCLUDED.sustainability,
        experience = EXCLUDED.experience,
        safety = EXCLUDED.safety,
        transparency = EXCLUDED.transparency,
        synergy = EXCLUDED.synergy,
        expert_summary = EXCLUDED.expert_summary,
        updated_at = NOW()
      RETURNING *
    `;

        // Revalidate product page
        revalidatePath(`/products/${productId}`);

        return {
            success: true,
            review: {
                ...result[0],
                id: result[0].id,
                product_id: result[0].product_id,
                sme_id: result[0].sme_id,
                created_at: result[0].created_at.toISOString(),
                updated_at: result[0].updated_at.toISOString(),
            }
        };
    } catch (error) {
        console.error('Error submitting SME review:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit review'
        };
    }
}

/**
 * Get all SME reviews for a product
 */
export async function getSMEReviews(productId: string): Promise<SMEReview[]> {
    try {
        const sql = getDb();

        const reviews = await sql`
      SELECT 
        sr.*,
        p.id as sme_profile_id,
        p.full_name,
        p.username,
        p.avatar_url,
        p.credentials,
        p.badge_type,
        p.profession
      FROM sme_reviews sr
      JOIN profiles p ON sr.sme_id = p.id
      WHERE sr.product_id::text = ${productId}
      ORDER BY sr.created_at DESC
    `;

        return reviews.map((review: any) => ({
            id: review.id,
            product_id: review.product_id,
            sme_id: review.sme_id,
            purity: review.purity,
            bioavailability: review.bioavailability,
            potency: review.potency,
            evidence: review.evidence,
            sustainability: review.sustainability,
            experience: review.experience,
            safety: review.safety,
            transparency: review.transparency,
            synergy: review.synergy,
            expert_summary: review.expert_summary,
            created_at: review.created_at instanceof Date ? review.created_at.toISOString() : review.created_at,
            updated_at: review.updated_at instanceof Date ? review.updated_at.toISOString() : review.updated_at,
            sme_profile: {
                id: review.sme_profile_id,
                full_name: review.full_name,
                username: review.username,
                avatar_url: review.avatar_url,
                credentials: review.credentials,
                badge_type: review.badge_type,
                profession: review.profession,
            }
        }));
    } catch (error) {
        console.error('Error fetching SME reviews:', error);
        return [];
    }
}

/**
 * Get average SME scores for a product
 */
export async function getAverageSMEScores(productId: string): Promise<{
    purity: number | null;
    bioavailability: number | null;
    potency: number | null;
    evidence: number | null;
    sustainability: number | null;
    experience: number | null;
    safety: number | null;
    transparency: number | null;
    synergy: number | null;
    reviewCount: number;
}> {
    try {
        const sql = getDb();

        const result = await sql`
      SELECT
        avg_sme_purity,
        avg_sme_bioavailability,
        avg_sme_potency,
        avg_sme_evidence,
        avg_sme_sustainability,
        avg_sme_experience,
        avg_sme_safety,
        avg_sme_transparency,
        avg_sme_synergy,
        sme_review_count
      FROM products
      WHERE id::text = ${productId}
      LIMIT 1
    `;

        if (!result || result.length === 0) {
            return {
                purity: null,
                bioavailability: null,
                potency: null,
                evidence: null,
                sustainability: null,
                experience: null,
                safety: null,
                transparency: null,
                synergy: null,
                reviewCount: 0,
            };
        }

        const data = result[0];
        return {
            purity: data.avg_sme_purity ? parseFloat(data.avg_sme_purity) : null,
            bioavailability: data.avg_sme_bioavailability ? parseFloat(data.avg_sme_bioavailability) : null,
            potency: data.avg_sme_potency ? parseFloat(data.avg_sme_potency) : null,
            evidence: data.avg_sme_evidence ? parseFloat(data.avg_sme_evidence) : null,
            sustainability: data.avg_sme_sustainability ? parseFloat(data.avg_sme_sustainability) : null,
            experience: data.avg_sme_experience ? parseFloat(data.avg_sme_experience) : null,
            safety: data.avg_sme_safety ? parseFloat(data.avg_sme_safety) : null,
            transparency: data.avg_sme_transparency ? parseFloat(data.avg_sme_transparency) : null,
            synergy: data.avg_sme_synergy ? parseFloat(data.avg_sme_synergy) : null,
            reviewCount: data.sme_review_count || 0,
        };
    } catch (error) {
        console.error('Error fetching average SME scores:', error);
        return {
            purity: null,
            bioavailability: null,
            potency: null,
            evidence: null,
            sustainability: null,
            experience: null,
            safety: null,
            transparency: null,
            synergy: null,
            reviewCount: 0,
        };
    }
}

/**
 * Check if current user is an SME
 */
export async function checkIsSME(): Promise<boolean> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return false;
        }

        const sql = getDb();
        const result = await sql`
      SELECT is_sme
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

        return result && result.length > 0 && result[0].is_sme === true;
    } catch (error) {
        console.error('Error checking SME status:', error);
        return false;
    }
}

/**
 * Get current user's review for a product (if exists)
 */
export async function getUserSMEReview(productId: string): Promise<SMEReview | null> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return null;
        }

        const sql = getDb();
        const result = await sql`
      SELECT *
      FROM sme_reviews
      WHERE product_id::text = ${productId}
        AND sme_id = ${userId}
      LIMIT 1
    `;

        if (!result || result.length === 0) {
            return null;
        }

        const review = result[0];
        return {
            id: review.id,
            product_id: review.product_id,
            sme_id: review.sme_id,
            purity: review.purity,
            bioavailability: review.bioavailability,
            potency: review.potency,
            evidence: review.evidence,
            sustainability: review.sustainability,
            experience: review.experience,
            safety: review.safety,
            transparency: review.transparency,
            synergy: review.synergy,
            expert_summary: review.expert_summary,
            created_at: review.created_at instanceof Date ? review.created_at.toISOString() : review.created_at,
            updated_at: review.updated_at instanceof Date ? review.updated_at.toISOString() : review.updated_at,
        };
    } catch (error) {
        console.error('Error fetching user SME review:', error);
        return null;
    }
}
