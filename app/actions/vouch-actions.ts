'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/admin';

/**
 * Submit a vouch for a user to become an SME
 * Automatically promotes to tier 3 at 3 vouches
 */
export async function submitVouch(targetUserId: string) {
    const voucherId = await getCurrentUserId();

    if (!voucherId) {
        throw new Error('You must be logged in to vouch');
    }

    const sql = getDb();

    try {
        // Call the database function
        const result = await sql`
      SELECT * FROM submit_vouch(${voucherId}, ${targetUserId})
    `;

        const response = result[0];

        if (!response.success) {
            throw new Error(response.message);
        }

        // Revalidate relevant pages
        revalidatePath(`/u/${targetUserId}`);
        revalidatePath('/feed');
        revalidatePath('/discussions');

        return {
            success: true,
            vouchCount: response.vouch_count,
            promoted: response.promoted,
            message: response.message,
        };
    } catch (error) {
        console.error('Error submitting vouch:', error);
        throw error;
    }
}

/**
 * Get vouch data for a user
 */
export async function getVouchData(targetUserId: string, currentUserId?: string) {
    const sql = getDb();

    try {
        // Get vouch count
        const countResult = await sql`
      SELECT get_vouch_count(${targetUserId}) as count
    `;
        const vouchCount = countResult[0]?.count || 0;

        // Check if current user has vouched (if logged in)
        let hasVouched = false;
        if (currentUserId) {
            const vouchedResult = await sql`
        SELECT has_vouched(${currentUserId}, ${targetUserId}) as vouched
      `;
            hasVouched = vouchedResult[0]?.vouched || false;
        }

        return {
            vouchCount,
            hasVouched,
        };
    } catch (error) {
        console.error('Error getting vouch data:', error);
        return {
            vouchCount: 0,
            hasVouched: false,
        };
    }
}
