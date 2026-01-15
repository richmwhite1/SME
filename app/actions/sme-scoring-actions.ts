"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { calculateSMEScore } from "@/lib/sme-scoring";

/**
 * Get a user's current SME score, Chakra level, and progress
 */
export async function getUserSMEScore(userId: string) {
    try {
        const sql = getDb();

        const result = await sql`
      SELECT 
        sme_score,
        chakra_level,
        sme_score_details,
        last_score_update
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

        if (result.length === 0) {
            throw new Error("User not found");
        }

        const user = result[0];

        return {
            score: parseFloat(user.sme_score) || 0,
            level: user.chakra_level || 1,
            details: user.sme_score_details || {},
            lastUpdate: user.last_score_update
        };
    } catch (error) {
        console.error("Error fetching SME score:", error);
        throw error;
    }
}

/**
 * Trigger recalculation of a user's SME score
 * This should be called after significant contributions or periodically
 */
export async function updateUserSMEScore(userId: string) {
    try {
        const user = await currentUser();

        // Only allow users to update their own score or admins
        if (!user || (user.id !== userId && !user.publicMetadata?.is_admin)) {
            throw new Error("Unauthorized");
        }

        // Calculate and update the score
        const result = await calculateSMEScore(userId, true);

        revalidatePath(`/u/${user.username}`);
        revalidatePath("/community");

        return {
            success: true,
            score: result.score,
            level: result.level,
            levelName: result.levelName
        };
    } catch (error) {
        console.error("Error updating SME score:", error);
        throw error;
    }
}

/**
 * Update a user's declared pillar expertise
 * Users can declare which of the 9 pillars they have expertise in
 */
export async function updatePillarExpertise(pillars: string[]) {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        // Validate pillars against the 9 SME pillars
        const validPillars = [
            "Purity", "Bioavailability", "Potency", "Evidence",
            "Sustainability", "Experience", "Safety", "Transparency", "Synergy"
        ];

        const filteredPillars = pillars.filter(p => validPillars.includes(p));

        // Limit to 5 pillars max
        const selectedPillars = filteredPillars.slice(0, 5);

        const sql = getDb();
        await sql`
      UPDATE profiles
      SET pillar_expertise = ${sql.json(selectedPillars)}
      WHERE id = ${user.id}
    `;

        revalidatePath(`/u/${user.username}`);
        revalidatePath("/community");

        return { success: true, pillars: selectedPillars };
    } catch (error) {
        console.error("Error updating pillar expertise:", error);
        throw error;
    }
}

/**
 * Get pillar expertise for a specific user
 */
export async function getUserPillarExpertise(userId: string) {
    try {
        const sql = getDb();

        const result = await sql`
      SELECT pillar_expertise
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

        if (result.length === 0) {
            return [];
        }

        const expertise = result[0].pillar_expertise;
        return Array.isArray(expertise) ? expertise : (expertise ? JSON.parse(expertise) : []);
    } catch (error) {
        console.error("Error fetching pillar expertise:", error);
        return [];
    }
}
