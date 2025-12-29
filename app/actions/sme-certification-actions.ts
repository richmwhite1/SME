"use server";

import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { createSMECertificationCheckout } from "@/lib/stripe-config";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Submit SME certification application
 */
export async function submitSMECertification(params: {
    productId: string;
    labReportUrls: string[];
    purityDataUrls: string[];
}) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Verify user is a brand rep
        const userCheck = await sql`
      SELECT role FROM profiles WHERE id = ${userId}
    `;

        if (userCheck.length === 0 || userCheck[0].role !== 'BRAND_REP') {
            return { success: false, error: "Only verified brand representatives can apply for SME certification" };
        }

        // Verify product ownership
        const productCheck = await sql`
      SELECT id, title, brand_owner_id, is_verified 
      FROM products 
      WHERE id = ${params.productId}
    `;

        if (productCheck.length === 0) {
            return { success: false, error: "Product not found" };
        }

        if (productCheck[0].brand_owner_id !== userId) {
            return { success: false, error: "You don't own this product" };
        }

        if (!productCheck[0].is_verified) {
            return { success: false, error: "Product must be verified before applying for SME certification" };
        }

        // Check if certification already exists
        const existingCert = await sql`
      SELECT id, status FROM sme_certifications 
      WHERE product_id = ${params.productId}
      AND status IN ('pending', 'under_review', 'approved')
    `;

        if (existingCert.length > 0) {
            return {
                success: false,
                error: "A certification request already exists for this product"
            };
        }

        // Validate document URLs
        if (params.labReportUrls.length === 0 && params.purityDataUrls.length === 0) {
            return { success: false, error: "At least one document is required" };
        }

        // Get user email from profiles
        const userProfile = await sql`
      SELECT email, full_name FROM profiles WHERE id = ${userId}
    `;

        const userEmail = userProfile[0].email || "";
        const userName = userProfile[0].full_name || "Brand Representative";

        // Create certification record
        const certification = await sql`
      INSERT INTO sme_certifications (
        product_id,
        brand_owner_id,
        lab_report_urls,
        purity_data_urls,
        status,
        payment_status
      ) VALUES (
        ${params.productId},
        ${userId},
        ${params.labReportUrls},
        ${params.purityDataUrls},
        'pending',
        'pending'
      )
      RETURNING id
    `;

        const certificationId = certification[0].id;

        // Create Stripe checkout session for $3,000
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const checkoutSession = await createSMECertificationCheckout({
            userId,
            userEmail,
            productId: params.productId,
            certificationId,
            successUrl: `${baseUrl}/brand/dashboard?certification_success=true`,
            cancelUrl: `${baseUrl}/brand/dashboard?certification_canceled=true`,
        });

        return {
            success: true,
            checkoutUrl: checkoutSession.url,
            certificationId,
        };
    } catch (error) {
        console.error("Error submitting SME certification:", error);
        return {
            success: false,
            error: "Failed to submit certification. Please try again.",
        };
    }
}

/**
 * Get SME certification status for a product
 */
export async function getSMECertificationStatus(productId: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        const certification = await sql`
      SELECT 
        id,
        status,
        payment_status,
        lab_report_urls,
        purity_data_urls,
        reviewer_notes,
        rejection_reason,
        created_at,
        reviewed_at
      FROM sme_certifications
      WHERE product_id = ${productId}
      AND brand_owner_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

        if (certification.length === 0) {
            return { success: true, certification: null };
        }

        return {
            success: true,
            certification: certification[0],
        };
    } catch (error) {
        console.error("Error getting certification status:", error);
        return { success: false, error: "Failed to get certification status" };
    }
}

/**
 * Admin/SME: Approve SME certification
 */
export async function approveSMECertification(certificationId: string, notes?: string) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Check if user is admin or verified expert
        const userCheck = await sql`
      SELECT is_admin, is_verified_expert FROM profiles WHERE id = ${userId}
    `;

        if (userCheck.length === 0 || (!userCheck[0].is_admin && !userCheck[0].is_verified_expert)) {
            return { success: false, error: "Unauthorized: Only admins and verified experts can approve certifications" };
        }

        // Get certification details
        const certification = await sql`
      SELECT 
        sc.id,
        sc.product_id,
        sc.payment_status
      FROM sme_certifications sc
      WHERE sc.id = ${certificationId}
    `;

        if (certification.length === 0) {
            return { success: false, error: "Certification not found" };
        }

        const { product_id, payment_status } = certification[0];

        // Check if payment is complete
        if (payment_status !== 'paid') {
            return {
                success: false,
                error: "Cannot approve: payment not completed"
            };
        }

        // Update certification status
        await sql`
      UPDATE sme_certifications
      SET 
        status = 'approved',
        reviewed_by = ${userId},
        reviewed_at = NOW(),
        reviewer_notes = ${notes || null}
      WHERE id = ${certificationId}
    `;

        // Update product: set is_sme_certified = true
        await sql`
      UPDATE products
      SET is_sme_certified = true
      WHERE id = ${product_id}
    `;

        return {
            success: true,
            message: "SME certification approved successfully",
        };
    } catch (error) {
        console.error("Error approving SME certification:", error);
        return {
            success: false,
            error: "Failed to approve certification",
        };
    }
}

/**
 * Admin/SME: Reject SME certification
 */
export async function rejectSMECertification(
    certificationId: string,
    reason: string
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Check if user is admin or verified expert
        const userCheck = await sql`
      SELECT is_admin, is_verified_expert FROM profiles WHERE id = ${userId}
    `;

        if (userCheck.length === 0 || (!userCheck[0].is_admin && !userCheck[0].is_verified_expert)) {
            return { success: false, error: "Unauthorized" };
        }

        // Update certification status
        await sql`
      UPDATE sme_certifications
      SET 
        status = 'rejected',
        reviewed_by = ${userId},
        reviewed_at = NOW(),
        rejection_reason = ${reason}
      WHERE id = ${certificationId}
    `;

        return {
            success: true,
            message: "SME certification rejected",
        };
    } catch (error) {
        console.error("Error rejecting SME certification:", error);
        return {
            success: false,
            error: "Failed to reject certification",
        };
    }
}

/**
 * Admin/SME: Request more information
 */
export async function requestMoreInfoSMECertification(
    certificationId: string,
    notes: string
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "Not authenticated" };
        }

        // Check if user is admin or verified expert
        const userCheck = await sql`
      SELECT is_admin, is_verified_expert FROM profiles WHERE id = ${userId}
    `;

        if (userCheck.length === 0 || (!userCheck[0].is_admin && !userCheck[0].is_verified_expert)) {
            return { success: false, error: "Unauthorized" };
        }

        // Update certification status
        await sql`
      UPDATE sme_certifications
      SET 
        status = 'more_info_needed',
        reviewed_by = ${userId},
        reviewed_at = NOW(),
        reviewer_notes = ${notes}
      WHERE id = ${certificationId}
    `;

        return {
            success: true,
            message: "More information requested",
        };
    } catch (error) {
        console.error("Error requesting more info:", error);
        return {
            success: false,
            error: "Failed to request more information",
        };
    }
}

/**
 * Handle Stripe webhook for SME certification payment
 */
export async function handleSMECertificationWebhook(event: any) {
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { certificationId, userId } = session.metadata;

                if (session.mode === 'payment' && session.payment_status === 'paid') {
                    const paymentIntentId = session.payment_intent;

                    // Update certification with payment data
                    await sql`
            UPDATE sme_certifications
            SET 
              stripe_payment_intent_id = ${paymentIntentId},
              payment_status = 'paid',
              status = 'under_review'
            WHERE id = ${certificationId}
          `;
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;

                // Update certification payment status
                await sql`
          UPDATE sme_certifications
          SET payment_status = 'failed'
          WHERE stripe_payment_intent_id = ${paymentIntent.id}
        `;
                break;
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error handling SME certification webhook:", error);
        return { success: false, error: "Webhook handling failed" };
    }
}
