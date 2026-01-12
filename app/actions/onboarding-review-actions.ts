"use server";

import { getDb } from "@/lib/db";
import { isAdmin, getCurrentUserId } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { createBrandSubscriptionCheckout } from "@/lib/stripe-config";

/**
 * Get all pending brand claims and product edits
 */
export async function getPendingClaims() {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            throw new Error("Unauthorized: Admin access required");
        }

        const sql = getDb();

        const claims = await sql`
      SELECT 
        po.id,
        po.product_id,
        po.user_id,
        po.submission_type,
        po.proposed_data,
        po.current_data,
        po.verification_status,
        po.payment_link_sent_at,
        po.subscription_status,
        po.created_at,
        p.title as product_title,
        p.slug as product_slug,
        prof.full_name as user_name,
        prof.email as user_email,
        prof.username as user_username
      FROM product_onboarding po
      LEFT JOIN products p ON po.product_id = p.id
      JOIN profiles prof ON po.user_id = prof.id
      WHERE po.verification_status IN ('pending', 'verified')
      ORDER BY po.created_at ASC
    `;

        return claims;
    } catch (error) {
        console.error("Error fetching pending claims:", error);
        throw error;
    }
}

/**
 * Get a single onboarding record by ID with full details
 */
export async function getOnboardingById(id: string) {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            throw new Error("Unauthorized: Admin access required");
        }

        const sql = getDb();

        const result = await sql`
      SELECT 
        po.id,
        po.product_id,
        po.user_id,
        po.submission_type,
        po.proposed_data,
        po.current_data,
        po.verification_status,
        po.reviewed_by,
        po.reviewed_at,
        po.rejection_reason,
        po.created_at,
        po.updated_at,
        p.title as product_title,
        p.slug as product_slug,
        p.images as product_images,
        p.buy_url as product_buy_url,
        prof.full_name as user_name,
        prof.email as user_email,
        prof.username as user_username,
        prof.avatar_url as user_avatar
      FROM product_onboarding po
      LEFT JOIN products p ON po.product_id = p.id
      JOIN profiles prof ON po.user_id = prof.id
      WHERE po.id = ${id}
    `;

        return result[0] || null;
    } catch (error) {
        console.error("Error fetching onboarding by ID:", error);
        throw error;
    }
}

/**
 * Approve a product onboarding submission
 * Updates verification_status to 'verified' and applies changes to products/profiles
 */
export async function approveProductOnboarding(id: string) {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            throw new Error("Unauthorized: Admin access required");
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("User ID not found");
        }

        const sql = getDb();

        // Get the onboarding record with full details
        const onboardingRecord = await sql`
      SELECT 
        po.*,
        p.brand_owner_id as current_brand_owner
      FROM product_onboarding po
      LEFT JOIN products p ON po.product_id = p.id
      WHERE po.id = ${id}
    `;

        if (onboardingRecord.length === 0) {
            throw new Error("Onboarding record not found");
        }

        const record = onboardingRecord[0];
        const { product_id, user_id, submission_type, proposed_data, current_brand_owner } = record;

        // Use atomic transaction to ensure all updates succeed or none do
        await sql.begin(async (sql) => {
            // 1. Update onboarding status
            await sql`
        UPDATE product_onboarding 
        SET 
          verification_status = 'verified',
          reviewed_by = ${userId},
          reviewed_at = NOW()
        WHERE id = ${id}
      `;

            // 2. Handle brand_claim submissions
            if (submission_type === 'brand_claim') {
                // Update product ownership and verification
                await sql`
          UPDATE products
          SET 
            brand_owner_id = ${user_id},
            is_verified = true,
            updated_at = NOW()
          WHERE id = ${product_id}
        `;

                // Update user role to BRAND_REP
                await sql`
          UPDATE profiles
          SET 
            is_brand_rep = true,
            role = 'BRAND_REP',
            updated_at = NOW()
          WHERE id = ${user_id}
        `;

                console.log(`✅ Brand claim approved: Product ${product_id} assigned to user ${user_id}`);
            }

            // 3. Handle product_edit submissions
            if (submission_type === 'product_edit' && proposed_data) {
                // Verify user owns the product or is admin
                if (current_brand_owner !== user_id && !adminStatus) {
                    throw new Error("User does not own this product");
                }

                // Apply proposed changes to product
                const updates = proposed_data as any;
                const updateFields: string[] = [];
                const updateValues: any[] = [];

                // Build dynamic update query based on proposed_data
                if (updates.title) {
                    updateFields.push('title = $' + (updateValues.length + 1));
                    updateValues.push(updates.title);
                }
                if (updates.problem_solved) {
                    updateFields.push('problem_solved = $' + (updateValues.length + 1));
                    updateValues.push(updates.problem_solved);
                }
                if (updates.buy_url) {
                    updateFields.push('buy_url = $' + (updateValues.length + 1));
                    updateValues.push(updates.buy_url);
                }
                if (updates.images) {
                    updateFields.push('images = $' + (updateValues.length + 1));
                    updateValues.push(updates.images);
                }

                if (updateFields.length > 0) {
                    updateFields.push('updated_at = NOW()');
                    await sql`
            UPDATE products
            SET ${sql(updateFields.join(', '))}
            WHERE id = ${product_id}
          `;
                }

                console.log(`✅ Product edit approved: Product ${product_id} updated`);
            }
        });

        revalidatePath("/admin/review");
        revalidatePath("/products");

        return { success: true, message: "Submission approved successfully" };
    } catch (error) {
        console.error("Error approving product onboarding:", error);
        throw error;
    }
}

/**
 * Admin: Send payment link for approved brand claim in product_onboarding
 */
export async function sendPaymentLinkForOnboarding(onboardingId: string) {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            throw new Error("Unauthorized: Admin access required");
        }

        const sql = getDb();

        // Get onboarding details
        const onboarding = await sql`
      SELECT 
        po.id,
        po.product_id,
        po.user_id,
        po.verification_status,
        po.submission_type,
        po.payment_link_sent_at,
        p.email,
        p.full_name
      FROM product_onboarding po
      JOIN profiles p ON po.user_id = p.id
      WHERE po.id = ${onboardingId}
    `;

        if (onboarding.length === 0) {
            throw new Error("Onboarding record not found");
        }

        const { product_id, user_id, verification_status, submission_type, email } = onboarding[0];

        // Check if already verified
        if (verification_status !== 'verified') {
            throw new Error("Onboarding must be verified before sending payment link");
        }

        // Only send payment links for brand claims
        if (submission_type !== 'brand_claim') {
            throw new Error("Payment links are only for brand claims");
        }

        // Create Stripe checkout session
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const checkoutSession = await createBrandSubscriptionCheckout({
            userId: user_id,
            userEmail: email,
            productId: product_id,
            verificationId: onboardingId,
            successUrl: `${baseUrl}/brand/verification/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/brand/dashboard`,
        });

        // Update payment_link_sent_at timestamp
        await sql`
      UPDATE product_onboarding
      SET payment_link_sent_at = NOW()
      WHERE id = ${onboardingId}
    `;

        revalidatePath("/admin/review");

        return {
            success: true,
            checkoutUrl: checkoutSession.url,
            message: "Payment link generated successfully",
        };
    } catch (error) {
        console.error("Error sending payment link for onboarding:", error);
        throw error;
    }
}

/**
 * Reject a product onboarding submission
 * Updates verification_status to 'rejected' with reason
 */
export async function rejectProductOnboarding(id: string, reason: string) {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            throw new Error("Unauthorized: Admin access required");
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            throw new Error("User ID not found");
        }

        const sql = getDb();

        // Update the verification status
        await sql`
      UPDATE product_onboarding 
      SET 
        verification_status = 'rejected',
        reviewed_by = ${userId},
        reviewed_at = NOW(),
        rejection_reason = ${reason}
      WHERE id = ${id}
    `;

        revalidatePath("/admin/review");

        return { success: true, message: "Submission rejected" };
    } catch (error) {
        console.error("Error rejecting product onboarding:", error);
        throw error;
    }
}

/**
 * Get statistics for the review dashboard
 */
export async function getReviewStats() {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            throw new Error("Unauthorized: Admin access required");
        }

        const sql = getDb();

        const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_count,
        COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE submission_type = 'brand_claim' AND verification_status = 'pending') as pending_brand_claims,
        COUNT(*) FILTER (WHERE submission_type = 'product_edit' AND verification_status = 'pending') as pending_product_edits
      FROM product_onboarding
    `;

        return (stats[0] as any) || {
            pending_count: 0,
            verified_count: 0,
            rejected_count: 0,
            pending_brand_claims: 0,
            pending_product_edits: 0,
        };
    } catch (error) {
        console.error("Error fetching review stats:", error);
        throw error;
    }
}
