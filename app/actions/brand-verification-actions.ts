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

    const userEmail = userProfile[0].email || params.workEmail;
    const userName = userProfile[0].full_name || "Brand Representative";

    // Create verification record
    const verification = await sql`
      INSERT INTO brand_verifications (
        product_id,
        user_id,
        work_email,
        linkedin_profile,
        company_website,
        status
      ) VALUES (
        ${params.productId},
        ${userId},
        ${params.workEmail},
        ${params.linkedinProfile},
        ${params.companyWebsite},
        'pending'
      )
      RETURNING id
    `;

    const verificationId = verification[0].id;

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const checkoutSession = await createBrandSubscriptionCheckout({
      userId,
      userEmail,
      productId: params.productId,
      verificationId,
      successUrl: `${baseUrl}/brand/verification/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/products/${params.productId}`,
    });

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
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
        bv.subscription_status
      FROM brand_verifications bv
      WHERE bv.id = ${verificationId}
    `;

    if (verification.length === 0) {
      return { success: false, error: "Verification not found" };
    }

    const { product_id, user_id, subscription_status } = verification[0];

    // Check if subscription is active
    if (subscription_status !== 'active') {
      return {
        success: false,
        error: "Cannot approve: subscription is not active"
      };
    }

    // Update verification status
    await sql`
      UPDATE brand_verifications
      SET 
        status = 'approved',
        reviewed_by = ${userId},
        reviewed_at = NOW()
      WHERE id = ${verificationId}
    `;

    // Update user role to business_user
    await sql`
      UPDATE profiles
      SET role = 'business_user'
      WHERE id = ${user_id}
    `;

    // Update product: set is_verified = true and brand_owner_id
    await sql`
      UPDATE products
      SET 
        is_verified = true,
        brand_owner_id = ${user_id}
      WHERE id = ${product_id}
    `;

    return {
      success: true,
      message: "Brand verification approved successfully",
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
 * Handle Stripe webhook for brand verification subscription
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
          `;
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        // Update verification subscription status
        await sql`
          UPDATE brand_verifications
          SET subscription_status = ${status}
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        // Update subscription record
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

        // Update verification subscription status
        await sql`
          UPDATE brand_verifications
          SET subscription_status = 'canceled'
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        // Update subscription record
        await sql`
          UPDATE stripe_subscriptions
          SET status = 'canceled'
          WHERE stripe_subscription_id = ${subscriptionId}
        `;

        // Optionally: Remove is_verified from product
        // This depends on your business logic
        break;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling webhook:", error);
    return { success: false, error: "Webhook handling failed" };
  }
}
