'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { isAdmin, getCurrentUserId } from '@/lib/admin';

/**
 * Fetches the SME review queue
 * Returns pending SME applications with candidate details
 */
export async function getSMEReviewQueue() {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
        throw new Error('Unauthorized: Admin access required');
    }

    const sql = getDb();

    try {
        const queue = await sql`
      SELECT *
      FROM admin_sme_review_queue
      ORDER BY reputation_score DESC, created_at ASC
    `;

        return queue;
    } catch (error) {
        console.error('Error fetching SME review queue:', error);
        throw new Error('Failed to fetch SME review queue');
    }
}

/**
 * Approves an SME application
 * Sets reputation_tier to 3 and updates application status
 */
export async function approveSMEApplication(applicationId: string, userId: string) {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
        throw new Error('Unauthorized: Admin access required');
    }

    const adminId = await getCurrentUserId();
    const sql = getDb();

    try {
        await sql.begin(async (tx) => {
            // Update the user's profile
            await tx`
        UPDATE profiles
        SET 
          reputation_tier = 3,
          is_verified_expert = true,
          needs_sme_review = false,
          updated_at = NOW()
        WHERE id = ${userId}
      `;

            // Update the application
            await tx`
        UPDATE sme_applications
        SET 
          status = 'approved',
          reviewed_by = ${adminId},
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${applicationId}
      `;

            // Log the admin action
            await tx`
        INSERT INTO admin_logs (admin_id, action, details)
        VALUES (
          ${adminId},
          'sme_application_approved',
          ${JSON.stringify({
                application_id: applicationId,
                user_id: userId,
            })}
        )
      `;
        });

        // Revalidate relevant pages
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin');

        return { success: true };
    } catch (error) {
        console.error('Error approving SME application:', error);
        throw new Error('Failed to approve SME application');
    }
}

/**
 * Rejects an SME application
 * Updates application status and clears needs_sme_review flag
 */
export async function rejectSMEApplication(applicationId: string, userId: string) {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
        throw new Error('Unauthorized: Admin access required');
    }

    const adminId = await getCurrentUserId();
    const sql = getDb();

    try {
        await sql.begin(async (tx) => {
            // Clear the review flag
            await tx`
        UPDATE profiles
        SET 
          needs_sme_review = false,
          updated_at = NOW()
        WHERE id = ${userId}
      `;

            // Update the application
            await tx`
        UPDATE sme_applications
        SET 
          status = 'rejected',
          reviewed_by = ${adminId},
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${applicationId}
      `;

            // Log the admin action
            await tx`
        INSERT INTO admin_logs (admin_id, action, details)
        VALUES (
          ${adminId},
          'sme_application_rejected',
          ${JSON.stringify({
                application_id: applicationId,
                user_id: userId,
            })}
        )
      `;
        });

        // Revalidate relevant pages
        revalidatePath('/admin/dashboard');
        revalidatePath('/admin');

        return { success: true };
    } catch (error) {
        console.error('Error rejecting SME application:', error);
        throw new Error('Failed to reject SME application');
    }
}
