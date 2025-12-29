"use server";

import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Add a community-suggested benefit to a product
 */
export async function addCommunityBenefit(
    productId: string,
    benefitData: {
        title: string;
        type: "anecdotal" | "evidence_based";
        citation?: string;
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Validate evidence-based benefits have citations
        if (benefitData.type === "evidence_based" && !benefitData.citation) {
            return {
                success: false,
                error: "Evidence-based benefits require a citation URL",
            };
        }

        const db = getDb();

        // Insert community benefit
        const result = await db`
      INSERT INTO product_benefits (
        product_id,
        benefit_title,
        benefit_type,
        citation_url,
        source_type,
        submitted_by
      ) VALUES (
        ${productId}::uuid,
        ${benefitData.title},
        ${benefitData.type},
        ${benefitData.citation || null},
        'community',
        ${userId}
      )
      RETURNING id
    `;

        revalidatePath(`/products/${productId}`);

        return {
            success: true,
            benefitId: result[0].id,
        };
    } catch (error) {
        console.error("Error adding community benefit:", error);
        return {
            success: false,
            error: "Failed to add benefit. Please try again.",
        };
    }
}

/**
 * Toggle vote on a benefit (upvote/downvote)
 */
export async function voteBenefit(
    benefitId: string,
    voteType: "upvote" | "downvote"
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        const db = getDb();

        // Use the database function to toggle vote
        const result = await db`
      SELECT * FROM toggle_benefit_vote(
        ${userId},
        ${benefitId}::uuid,
        ${voteType}
      )
    `;

        const voteResult = result[0];

        return {
            success: true,
            voted: voteResult.voted,
            upvoteCount: voteResult.new_upvote_count,
            downvoteCount: voteResult.new_downvote_count,
        };
    } catch (error) {
        console.error("Error voting on benefit:", error);
        return {
            success: false,
            error: "Failed to vote. Please try again.",
        };
    }
}

/**
 * Update an official benefit (requires brand ownership)
 */
export async function updateOfficialBenefit(
    benefitId: string,
    productId: string,
    benefitData: {
        title: string;
        type: "anecdotal" | "evidence_based";
        citation?: string;
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        const db = getDb();

        // Check if user owns the brand
        const productCheck = await db`
      SELECT is_verified, brand_owner_id
      FROM products
      WHERE id::text = ${productId}
    `;

        if (productCheck.length === 0) {
            return { success: false, error: "Product not found" };
        }

        const product = productCheck[0];
        if (!product.is_verified || product.brand_owner_id !== userId) {
            return {
                success: false,
                error: "You must be the verified brand owner to edit official benefits",
            };
        }

        // Validate evidence-based benefits have citations
        if (benefitData.type === "evidence_based" && !benefitData.citation) {
            return {
                success: false,
                error: "Evidence-based benefits require a citation URL",
            };
        }

        // Update benefit
        await db`
      UPDATE product_benefits
      SET 
        benefit_title = ${benefitData.title},
        benefit_type = ${benefitData.type},
        citation_url = ${benefitData.citation || null},
        updated_at = NOW()
      WHERE id::text = ${benefitId}
      AND source_type = 'official'
    `;

        revalidatePath(`/products/${productId}`);

        return { success: true };
    } catch (error) {
        console.error("Error updating official benefit:", error);
        return {
            success: false,
            error: "Failed to update benefit. Please try again.",
        };
    }
}

/**
 * Delete an official benefit (requires brand ownership)
 */
export async function deleteOfficialBenefit(
    benefitId: string,
    productId: string
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        const db = getDb();

        // Check if user owns the brand
        const productCheck = await db`
      SELECT is_verified, brand_owner_id
      FROM products
      WHERE id::text = ${productId}
    `;

        if (productCheck.length === 0) {
            return { success: false, error: "Product not found" };
        }

        const product = productCheck[0];
        if (!product.is_verified || product.brand_owner_id !== userId) {
            return {
                success: false,
                error: "You must be the verified brand owner to delete official benefits",
            };
        }

        // Delete benefit
        await db`
      DELETE FROM product_benefits
      WHERE id::text = ${benefitId}
      AND source_type = 'official'
    `;

        revalidatePath(`/products/${productId}`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting official benefit:", error);
        return {
            success: false,
            error: "Failed to delete benefit. Please try again.",
        };
    }
}

/**
 * Get user's vote on a benefit
 */
export async function getUserBenefitVote(benefitId: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: true, vote: null };
        }

        const db = getDb();

        const result = await db`
      SELECT vote_type
      FROM benefit_votes
      WHERE user_id = ${userId}
      AND benefit_id::text = ${benefitId}
    `;

        return {
            success: true,
            vote: result.length > 0 ? result[0].vote_type : null,
        };
    } catch (error) {
        console.error("Error getting user vote:", error);
        return { success: false, error: "Failed to get vote status" };
    }
}
