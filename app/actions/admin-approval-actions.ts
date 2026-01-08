'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { isAdmin, getCurrentUserId } from '@/lib/admin';

/**
 * Fetches the admin approval queue
 * Returns products pending review with signal counts
 */
export async function getApprovalQueue() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }

  const sql = getDb();

  try {
    const queue = await sql`
      SELECT *
      FROM admin_approval_queue
      ORDER BY created_at DESC
    `;

    return queue;
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    throw new Error('Failed to fetch approval queue');
  }
}

/**
 * Updates a product's approval status, certification tier, and admin notes
 */
export async function updateProductApproval(
  productId: string,
  data: {
    admin_status: 'approved' | 'rejected' | 'pending_review';
    certification_tier: 'None' | 'Bronze' | 'Silver' | 'Gold';
    admin_notes?: string;
    verification_flags?: any;
    tech_docs?: { url: string };
    target_audience?: string;
    core_value_proposition?: string;
    technical_specs?: Record<string, string>;
    sme_access_note?: string;
    video_url?: string;
  }
) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }

  const adminId = await getCurrentUserId();
  const sql = getDb();

  try {
    // Update product in a transaction
    await sql.begin(async (tx) => {
      // Update the product
      await tx`
        UPDATE products
        SET 
          admin_status = ${data.admin_status},
          certification_tier = ${data.certification_tier},
          admin_notes = ${data.admin_notes || null},
          is_sme_certified = ${data.admin_status === 'approved' && data.certification_tier !== 'None'},
          updated_at = NOW()
        WHERE id = ${productId}
      `;

      // Log the admin action
      await tx`
        INSERT INTO admin_logs (admin_id, action, details)
        VALUES (
          ${adminId},
          'product_approval_decision',
          ${JSON.stringify({
        product_id: productId,
        admin_status: data.admin_status,
        certification_tier: data.certification_tier,
        has_notes: !!data.admin_notes,
      })}
        )
      `;
    });

    // Revalidate the dashboard page
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin');
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    console.error('Error updating product approval:', error);
    throw new Error('Failed to update product approval');
  }
}

/**
 * Fetches detailed product data for the audit page
 */
export async function getProductForAudit(productId: string) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }

  const sql = getDb();

  try {
    const product = await sql`
      SELECT *
      FROM products
      WHERE id = ${productId}
    `;

    if (!product || product.length === 0) {
      throw new Error('Product not found');
    }

    // Fetch benefits
    const benefits = await sql`
      SELECT * FROM product_benefits WHERE product_id = ${productId}
    `;

    const productData = product[0];

    // Parse radar data from sme_signals if available
    let radarData = {
      scientific: 0,
      alternative: 0,
      esoteric: 0,
    };

    let signals = {};

    if (productData.sme_signals) {
      try {
        signals = typeof productData.sme_signals === 'string'
          ? JSON.parse(productData.sme_signals)
          : productData.sme_signals;

        radarData = {
          scientific: parseInt((signals as any).scientific || '0'),
          alternative: parseInt((signals as any).alternative || '0'),
          esoteric: parseInt((signals as any).esoteric || '0'),
        };
      } catch (e) {
        console.error('Error parsing sme_signals:', e);
      }
    }

    return {
      ...productData,
      radar_data: radarData,
      sme_signals: signals,
      benefits: benefits, // Attach benefits
      active_ingredients: productData.active_ingredients || [],
      excipients: productData.excipients || [],
      tech_docs: productData.tech_docs || [], // Ensure we use the new column
    };
  } catch (error) {
    console.error('Error fetching product for review:', error);
    throw new Error('Failed to fetch product details');
  }
}

/**
 * Submits the product audit decision and updates product data atomically
 */
export async function submitProductAudit(
  productId: string,
  data: {
    // Core product fields
    name?: string;
    title?: string;
    brand?: string;
    category?: string;
    third_party_lab_link?: string;
    // Existing fields
    admin_status: 'approved' | 'rejected' | 'pending_review';
    certification_tier: 'None' | 'Unverified' | 'Verified' | 'SME Certified'; // Updated types
    admin_notes?: string;
    product_photos: string[];
    video_url?: string;
    company_blurb?: string;
    sme_signals: any;
    // New Audit Fields
    tech_docs?: any[];
    target_audience?: string;
    core_value_proposition?: string;
    technical_specs?: any;
    sme_access_note?: string;
    // Parity Fields
    active_ingredients?: any[];
    excipients?: string[];
    benefits?: any[];
  }
) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }

  const adminId = await getCurrentUserId();
  const sql = getDb();

  try {
    // Update product in a transaction
    await sql.begin(async (tx) => {
      // Update the product
      await tx`
        UPDATE products
        SET 
          name = ${data.name || null},
          title = ${data.title || data.name || null},
          brand = ${data.brand || null},
          category = ${data.category || null},
          third_party_lab_link = ${data.third_party_lab_link || null},
          admin_status = ${data.admin_status},
          certification_tier = ${data.certification_tier},
          admin_notes = ${data.admin_notes || null},
          product_photos = ${data.product_photos},
          youtube_link = ${data.video_url || null},
          company_blurb = ${data.company_blurb || null},
          sme_signals = ${JSON.stringify(data.sme_signals)},
          tech_docs = ${JSON.stringify(data.tech_docs || [])}, -- Use new column
          target_audience = ${data.target_audience || null},
          core_value_proposition = ${data.core_value_proposition || null},
          technical_specs = ${data.technical_specs ? JSON.stringify(data.technical_specs) : null},
          active_ingredients = ${JSON.stringify(data.active_ingredients || [])},
          excipients = ${JSON.stringify(data.excipients || [])},
          sme_access_note = ${data.sme_access_note || null},
          is_sme_certified = ${data.admin_status === 'approved' && data.certification_tier === 'SME Certified'},
          updated_at = NOW()
        WHERE id = ${productId}
      `;

      // Handle Benefits (Delete all and re-insert)
      await tx`DELETE FROM product_benefits WHERE product_id = ${productId}`;

      if (data.benefits && data.benefits.length > 0) {
        for (const benefit of data.benefits) {
          // Handle benefits that might just be titles or full objects? 
          // In wizard it's { title, type, citation? }. 
          // We'll assume complete objects.
          await tx`
                INSERT INTO product_benefits (
                    product_id,
                    benefit_title,
                    benefit_type,
                    citation_url,
                    source_type,
                    submitted_by,
                    is_verified
                ) VALUES (
                    ${productId}::uuid,
                    ${benefit.benefit_title || benefit.title},
                    ${benefit.benefit_type || benefit.type || 'functional'},
                    ${benefit.citation_url || benefit.citation || null},
                    'admin_audit',
                    ${adminId},
                    ${benefit.is_verified || true}
                )
             `;
        }
      }

      // Log the admin action
      await tx`
        INSERT INTO admin_logs (admin_id, action, details)
        VALUES (
          ${adminId},
          'product_audit_submission',
          ${JSON.stringify({
        product_id: productId,
        admin_status: data.admin_status,
        certification_tier: data.certification_tier,
        changes: {
          photos_count: data.product_photos.length,
          audit_fields_updated: true,
          benefits_updated: true
        }
      })}
        )
      `;
    });

    // Revalidate relevant paths
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/approval/${productId}`);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    console.error('Error submitting product audit:', error);
    throw new Error('Failed to submit product audit');
  }
}

/**
 * Fetches detailed product data for the review modal
 * @deprecated Use getProductForAudit instead
 */
export async function getProductForReview(productId: string) {
  return getProductForAudit(productId);
}

/**
 * Updates just the product photos (immediate save)
 */
export async function updateProductPhotos(productId: string, photos: string[]) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }

  const sql = getDb();

  try {
    await sql`
      UPDATE products
      SET 
        product_photos = ${photos},
        updated_at = NOW()
      WHERE id = ${productId}
    `;

    revalidatePath(`/admin/approval/${productId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating product photos:', error);
    throw new Error('Failed to update product photos');
  }
}
