"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { createBrandSubscriptionCheckout } from "@/lib/stripe-config";

/**
 * Submit brand verification application
 */
export async function submitBrandVerification(params: {
  productId: string;
  workEmail: string;
  linkedinProfile: string;
  companyWebsite: string;
  founderComments?: string;
  intentionStatement: string;
  labReportUrl?: string;
}) {
  try {
    const sql = getDb();
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate URLs
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+/;
    const urlRegex = /^https?:\/\/.+\..+/;

    if (!linkedinRegex.test(params.linkedinProfile)) {
      return { success: false, error: "Invalid LinkedIn profile URL" };
    }

    if (!urlRegex.test(params.companyWebsite)) {
      return { success: false, error: "Invalid company website URL" };
    }

    // Validate lab report URL if provided
    if (params.labReportUrl && !urlRegex.test(params.labReportUrl)) {
      return { success: false, error: "Invalid lab report URL" };
    }

    // Validate intention statement
    if (!params.intentionStatement || params.intentionStatement.length < 50) {
      return { success: false, error: "Intention statement must be at least 50 characters" };
    }

    // Check if product exists
    const productCheck = await sql`
      SELECT id, title FROM products WHERE id = ${params.productId}
    `;

    if (productCheck.length === 0) {
      return { success: false, error: "Product not found" };
    }

    // Check if verification already exists for this product
    const existingVerification = await sql`
      SELECT id, status FROM brand_verifications 
      WHERE product_id = ${params.productId}
      AND status IN ('pending', 'approved')
    `;

    if (existingVerification.length > 0) {
      return {
        success: false,
        error: "A verification request already exists for this product"
      };
    }

    // Get user email from profiles
    const userProfile = await sql`
      SELECT email, full_name FROM profiles WHERE id = ${userId}
    `;

    if (userProfile.length === 0) {
      return { success: false, error: "User profile not found" };
    }

    // Create verification record with new fields
    const verification = await sql`
      INSERT INTO brand_verifications (
        product_id,
        user_id,
        work_email,
        linkedin_profile,
        company_website,
        founder_comments,
        intention_statement,
        lab_report_url,
        status
      ) VALUES (
        ${params.productId},
        ${userId},
        ${params.workEmail},
        ${params.linkedinProfile},
        ${params.companyWebsite},
        ${params.founderComments || null},
        ${params.intentionStatement},
        ${params.labReportUrl || null},
        'pending'
      )
      RETURNING id
    `;

    const verificationId = verification[0].id;

    // Return success without Stripe checkout URL
    return {
      success: true,
      verificationId,
    };
  } catch (error) {
    console.error("Error submitting brand verification:", error);
    return {
      success: false,
      error: "Failed to submit verification. Please try again.",
    };
  }
}

/**
 * Get brand verification status
 */
export async function getBrandVerificationStatus(verificationId: string) {
  try {
    const sql = getDb();
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const verification = await sql`
      SELECT 
        id,
        status,
        subscription_status,
        created_at,
        reviewed_at,
        rejection_reason
      FROM brand_verifications
      WHERE id = ${verificationId}
      AND user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (verification.length === 0) {
      return { success: true, verification: null };
    }

    return {
      success: true,
      verification: verification[0],
    };
  } catch (error) {
    console.error("Error getting verification status:", error);
    return { success: false, error: "Failed to get verification status" };
  }
}

/**
 * Admin: Send payment link for approved brand verification (legacy)
 * @deprecated Use sendPaymentLinkForOnboarding instead
 */
export async function sendPaymentLink(verificationId: string) {
  try {
    const sql = getDb();
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM profiles WHERE id = ${userId}
    `;

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Get verification details
    const verification = await sql`
      SELECT 
        bv.id,
        bv.product_id,
        bv.user_id,
        bv.status,
        bv.payment_link_sent_at,
        p.email,
        p.full_name
      FROM brand_verifications bv
      JOIN profiles p ON bv.user_id = p.id
      WHERE bv.id = ${verificationId}
    `;

    if (verification.length === 0) {
      return { success: false, error: "Verification not found" };
    }

    const { product_id, user_id, status, payment_link_sent_at, email, full_name } = verification[0];

    // Check if already approved
    if (status !== 'approved') {
      return {
        success: false,
        error: "Verification must be approved before sending payment link"
      };
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const checkoutSession = await createBrandSubscriptionCheckout({
      userId: user_id,
      userEmail: email,
      productId: product_id,
      verificationId,
      successUrl: `${baseUrl}/brand/verification/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/brand/dashboard`,
    });

    // Update payment_link_sent_at timestamp
    await sql`
      UPDATE brand_verifications
      SET payment_link_sent_at = NOW()
      WHERE id = ${verificationId}
    `;

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
      message: "Payment link generated successfully",
    };
  } catch (error) {
    console.error("Error sending payment link:", error);
    return {
      success: false,
      error: "Failed to generate payment link",
    };
  }
}

/**
 * Admin: Approve brand verification
 */
export async function approveBrandVerification(verificationId: string) {
  try {
    const sql = getDb();
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM profiles WHERE id = ${userId}
    `;

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Get verification details
    const verification = await sql`
      SELECT 
        bv.id,
        bv.product_id,
        bv.user_id,
        bv.status
      FROM brand_verifications bv
      WHERE bv.id = ${verificationId}
    `;

    if (verification.length === 0) {
      return { success: false, error: "Verification not found" };
    }

    const { status } = verification[0];

    // Check if already approved
    if (status === 'approved') {
      return {
        success: false,
        error: "Verification is already approved"
      };
    }

    // Update verification status to approved
    // User role and product verification will be updated after payment via webhook
    await sql`
      UPDATE brand_verifications
      SET 
        status = 'approved',
        reviewed_by = ${userId},
        reviewed_at = NOW()
      WHERE id = ${verificationId}
    `;

    return {
      success: true,
      message: "Brand verification approved. You can now send the payment link.",
    };
  } catch (error) {
    console.error("Error approving brand verification:", error);
    return {
      success: false,
      error: "Failed to approve verification",
    };
  }
}

/**
 * Admin: Reject brand verification
 */
export async function rejectBrandVerification(
  verificationId: string,
  reason?: string
) {
  try {
    const sql = getDb();
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM profiles WHERE id = ${userId}
    `;

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Update verification status
    await sql`
      UPDATE brand_verifications
      SET 
        status = 'rejected',
        reviewed_by = ${userId},
        reviewed_at = NOW(),
        rejection_reason = ${reason}
      WHERE id = ${verificationId}
    `;

    return {
      success: true,
      message: "Brand verification rejected",
    };
  } catch (error) {
    console.error("Error rejecting brand verification:", error);
    return {
      success: false,
      error: "Failed to reject verification",
    };
  }
}

/**
 * Admin: Send payment link for approved product onboarding (brand claim)
 */
export async function sendPaymentLinkForOnboarding(onboardingId: string) {
  try {
    const sql = getDb();
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM profiles WHERE id = ${userId}
    `;

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      return { success: false, error: "Unauthorized" };
    }

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
      return { success: false, error: "Onboarding record not found" };
    }

    const { product_id, user_id, verification_status, submission_type, payment_link_sent_at, email, full_name } = onboarding[0];

    // Check if already verified
    if (verification_status !== 'verified') {
      return {
        success: false,
        error: "Onboarding must be verified before sending payment link"
      };
    }

    // Only send payment links for brand claims
    if (submission_type !== 'brand_claim') {
      return {
        success: false,
        error: "Payment links are only for brand claims"
      };
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const checkoutSession = await createBrandSubscriptionCheckout({
      userId: user_id,
      userEmail: email,
      productId: product_id,
      verificationId: onboardingId, // Use onboarding ID as verification ID
      successUrl: `${baseUrl}/brand/verification/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/brand/dashboard`,
    });

    // Update payment_link_sent_at timestamp
    await sql`
      UPDATE product_onboarding
      SET payment_link_sent_at = NOW()
      WHERE id = ${onboardingId}
    `;

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
      message: "Payment link generated successfully",
    };
  } catch (error) {
    console.error("Error sending payment link for onboarding:", error);
    return {
      success: false,
      error: "Failed to generate payment link",
    };
  }
}

/**
 * Handle Stripe webhook for brand verification subscription
 * Supports both brand_verifications and product_onboarding tables
 */
export async function handleBrandVerificationWebhook(event: any) {
  const sql = getDb();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { verificationId, userId } = session.metadata;

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription;
          const customerId = session.customer;

          // Use atomic transaction for all updates
          await sql.begin(async (sql) => {
            // Try product_onboarding first (new system)
            const onboarding = await sql`
              SELECT product_id, verification_status, submission_type
              FROM product_onboarding
              WHERE id = ${verificationId}
            `;

            if (onboarding.length > 0) {
              // New system: product_onboarding
              const { product_id, verification_status, submission_type } = onboarding[0];

              // Update onboarding with Stripe data
              await sql`
                UPDATE product_onboarding
                SET 
                  stripe_subscription_id = ${subscriptionId},
                  stripe_customer_id = ${customerId},
                  subscription_status = 'active'
                WHERE id = ${verificationId}
              `;

              // Create subscription record
              await sql`
                INSERT INTO stripe_subscriptions (
                  user_id,
                  stripe_subscription_id,
                  stripe_customer_id,
                  subscription_type,
                  status
                ) VALUES (
                  ${userId},
                  ${subscriptionId},
                  ${customerId},
                  'brand_base',
                  'active'
                )
                ON CONFLICT (stripe_subscription_id) DO UPDATE
                SET status = 'active'
              `;

              // If verified AND brand_claim AND payment complete, finalize
              if (verification_status === 'verified' && submission_type === 'brand_claim') {
                // Update user role to BRAND_REP
                await sql`
                  UPDATE profiles
                  SET is_brand_rep = true,
                      role = 'BRAND_REP'
                  WHERE id = ${userId}
                `;

                // Update product: set is_verified = true and brand_owner_id
                await sql`
                  UPDATE products
                  SET 
                    is_verified = true,
                    brand_owner_id = ${userId}
                  WHERE id = ${product_id}
                `;

                console.log('✅ Brand claim payment completed:', userId, 'product:', product_id);
              }
            } else {
              // Fallback: Legacy brand_verifications table
              const verification = await sql`
                SELECT product_id, status
                FROM brand_verifications
                WHERE id = ${verificationId}
              `;

              if (verification.length === 0) {
                console.error('❌ Verification not found:', verificationId);
                return;
              }

              const { product_id, status } = verification[0];

              // Update verification with Stripe data
              await sql`
                UPDATE brand_verifications
                SET 
                  stripe_subscription_id = ${subscriptionId},
                  stripe_customer_id = ${customerId},
                  subscription_status = 'active'
                WHERE id = ${verificationId}
              `;

              // Create subscription record
              await sql`
                INSERT INTO stripe_subscriptions (
                  user_id,
                  stripe_subscription_id,
                  stripe_customer_id,
                  subscription_type,
                  status
                ) VALUES (
                  ${userId},
                  ${subscriptionId},
                  ${customerId},
                  'brand_base',
                  'active'
                )
                ON CONFLICT (stripe_subscription_id) DO UPDATE
                SET status = 'active'
              `;

              // If approved AND payment complete, finalize
              if (status === 'approved') {
                await sql`
                  UPDATE profiles
                  SET is_brand_rep = true,
                      role = 'BRAND_REP'
                  WHERE id = ${userId}
                `;

                await sql`
                  UPDATE products
                  SET 
                    is_verified = true,
                    brand_owner_id = ${userId}
                  WHERE id = ${product_id}
                `;

                console.log('✅ Legacy brand verification completed:', userId, 'product:', product_id);
              }
            }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        // Update both tables
        await sql`
          UPDATE brand_verifications
          SET subscription_status = ${status}
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        await sql`
          UPDATE product_onboarding
          SET subscription_status = ${status}
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        await sql`
          UPDATE stripe_subscriptions
          SET 
            status = ${status},
            current_period_start = to_timestamp(${subscription.current_period_start}),
            current_period_end = to_timestamp(${subscription.current_period_end}),
            cancel_at_period_end = ${subscription.cancel_at_period_end}
          WHERE stripe_subscription_id = ${subscriptionId}
        `;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        // Update both tables
        await sql`
          UPDATE brand_verifications
          SET subscription_status = 'canceled'
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        await sql`
          UPDATE product_onboarding
          SET subscription_status = 'canceled'
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        await sql`
          UPDATE stripe_subscriptions
          SET status = 'canceled'
          WHERE stripe_subscription_id = ${subscriptionId}
        `;
        break;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return { success: false, error: "Webhook handling failed" };
  }
}
