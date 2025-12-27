"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export async function getSMEStatus() {
    const user = await currentUser();

    if (!user) {
        return { isSME: false };
    }

    const sql = getDb();

    try {
        const profile = await sql`
      SELECT is_sme, badge_type, contributor_score, is_verified_expert
      FROM profiles 
      WHERE id = ${user.id}
      LIMIT 1
    `;

        if (!profile || profile.length === 0) {
            return { isSME: false };
        }

        const p = profile[0];
        const isVerifiedSme = (p.contributor_score || 0) >= 300;
        // Check all criteria: explicit flag, trusted voice badge, or verified score
        const isSME = p.is_sme || p.badge_type === 'Trusted Voice' || isVerifiedSme || p.is_verified_expert;

        return { isSME };
    } catch (error) {
        console.error("Error checking SME status:", error);
        return { isSME: false };
    }
}
