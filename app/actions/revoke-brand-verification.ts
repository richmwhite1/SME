"use server";

import { getDb } from "@/lib/db";

/**
 * Revoke brand verification and all associated privileges
 * Called when payment fails or subscription is canceled
 */
export async function revokeBrandVerification(params: {
  stripeCustomerId?: string;
  userId?: string;
  reason: "payment_failed" | "subscription_canceled" | "manual";
}) {
  try {
    const sql = getDb();
    const { stripeCustomerId, userId, reason } = params;

    // Find brand verification record
    let brandVerification;
    if (stripeCustomerId) {
      const result = await sql`
        SELECT 
          bv.id,
          bv.user_id,
          bv.product_id,
          bv.stripe_customer_id,
          bv.subscription_status
        FROM brand_verifications bv
        WHERE bv.stripe_customer_id = ${stripeCustomerId}
        AND bv.status = 'approved'
        LIMIT 1
      `;
      brandVerification = result[0];
    } else if (userId) {
      const result = await sql`
        SELECT 
          bv.id,
          bv.user_id,
          bv.product_id,
          bv.stripe_customer_id,
          bv.subscription_status
        FROM brand_verifications bv
        WHERE bv.user_id = ${userId}
        AND bv.status = 'approved'
        LIMIT 1
      `;
      brandVerification = result[0];
    }

    if (!brandVerification) {
      console.log("No brand verification found for revocation");
      return { success: false, error: "Brand verification not found" };
    }

    const { user_id, product_id } = brandVerification;

    console.log(`🚨 Revoking brand verification for user ${user_id}, reason: ${reason}`);

    // Update subscription status based on reason
    const newStatus = reason === "payment_failed" ? "past_due" : "canceled";

    // Update brand verification record
    await sql`
      UPDATE brand_verifications
      SET 
        subscription_status = ${newStatus},
        updated_at = NOW()
      WHERE id = ${brandVerification.id}
    `;

    console.log(`✓ Updated brand_verifications.subscription_status to ${newStatus}`);

    // Revoke verification for ALL products owned by this brand
    const updatedProducts = await sql`
      UPDATE products
      SET 
        is_verified = false,
        updated_at = NOW()
      WHERE brand_owner_id = ${user_id}
      RETURNING id, title
    `;

    console.log(`✓ Revoked verification for ${updatedProducts.length} product(s)`);

    // Log the revocation event
    await sql`
      INSERT INTO brand_verification_events (
        brand_verification_id,
        event_type,
        event_data,
        created_at
      ) VALUES (
        ${brandVerification.id},
        'verification_revoked',
        ${JSON.stringify({
      reason,
      products_affected: updatedProducts.length,
      timestamp: new Date().toISOString(),
    })},
        NOW()
      )
    `.catch(() => {
      // Table might not exist yet, that's okay
      console.log("⚠️ Could not log event (events table may not exist)");
    });

    console.log(`✅ Brand verification revoked successfully`);

    return {
      success: true,
      message: "Brand verification revoked",
      productsAffected: updatedProducts.length,
      newStatus,
    };
  } catch (error) {
    console.error("❌ Error revoking brand verification:", error);
    return {
      success: false,
      error: `Failed to revoke brand verification: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Restore brand verification (e.g., after successful payment)
 */
export async function restoreBrandVerification(params: {
  stripeCustomerId: string;
}) {
  try {
    const sql = getDb();
    const { stripeCustomerId } = params;

    // Find brand verification record
    const result = await sql`
      SELECT 
        bv.id,
        bv.user_id,
        bv.product_id,
        bv.subscription_status
      FROM brand_verifications bv
      WHERE bv.stripe_customer_id = ${stripeCustomerId}
      AND bv.status = 'approved'
      LIMIT 1
    `;

    const brandVerification = result[0];

    if (!brandVerification) {
      return { success: false, error: "Brand verification not found" };
    }

    const { user_id } = brandVerification;

    console.log(`✅ Restoring brand verification for user ${user_id}`);

    // Update subscription status to active
    await sql`
      UPDATE brand_verifications
      SET 
        subscription_status = 'active',
        updated_at = NOW()
      WHERE id = ${brandVerification.id}
    `;

    console.log(`✓ Updated brand_verifications.subscription_status to active`);

    // Restore verification for all products owned by this brand
    const updatedProducts = await sql`
      UPDATE products
      SET 
        is_verified = true,
        updated_at = NOW()
      WHERE brand_owner_id = ${user_id}
      RETURNING id, title
    `;

    console.log(`✓ Restored verification for ${updatedProducts.length} product(s)`);

    // Log the restoration event
    await sql`
      INSERT INTO brand_verification_events (
        brand_verification_id,
        event_type,
        event_data,
        created_at
      ) VALUES (
        ${brandVerification.id},
        'verification_restored',
        ${JSON.stringify({
      products_affected: updatedProducts.length,
      timestamp: new Date().toISOString(),
    })},
        NOW()
      )
    `.catch(() => {
      console.log("⚠️ Could not log event (events table may not exist)");
    });

    console.log(`✅ Brand verification restored successfully`);

    return {
      success: true,
      message: "Brand verification restored",
      productsAffected: updatedProducts.length,
    };
  } catch (error) {
    console.error("❌ Error restoring brand verification:", error);
    return {
      success: false,
      error: "Failed to restore brand verification",
    };
  }
}
