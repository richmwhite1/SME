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
            levelName: result.levelName,
            details: result.details,
            pillarScores: result.pillarScores,
            gainedExpertise: result.gainedExpertise
        };
    } catch (error) {
        console.error("Error updating SME score:", error);
        throw error;
    }
}

/**
 * Update a user's declared pillar expertise
 * NOTE: With the new Self-Regulating System, expertise is earned, not just declared.
 * This function now validates that the user actually HAS the expertise they want to highlight,
 * or it could be used to select WHICH of their earned expertise to display if we limit it.
 * For now, this effectively becomes a "Display Preferences" update for earned pillars.
 */
export async function updatePillarExpertise(pillars: string[]) {
    try {
        const user = await currentUser();
        if (!user) throw new Error("Unauthorized");

        const sql = getDb();

        // 1. Get user's EARNED expertise
        const profile = await sql`
            SELECT pillar_expertise FROM profiles WHERE id = ${user.id}
        `;

        const earnedExpertise = profile[0]?.pillar_expertise || [];
        const earnedList = Array.isArray(earnedExpertise)
            ? earnedExpertise
            : (typeof earnedExpertise === 'string' ? JSON.parse(earnedExpertise) : []);

        // 2. Filter requested pillars against EARNED pillars
        // Only allow selecting pillars that are effectively earned
        const validPillars = pillars.filter(p => earnedList.includes(p));

        // If they try to set something they haven't earned, we reject it (or just ignore it).
        // For now, let's strictly enforce "Earned only".

        // However, if the user has NO earned expertise, they can't set anything.
        // This replaces the old "Self-Declare" behavior.

        // Limit to 5 pillars max
        const selectedPillars = validPillars.slice(0, 5);

        // Update DB
        // NOTE: This might be redundant if calculateSMEScore always overwrites 'pillar_expertise'.
        // If we want 'pillar_expertise' to be the LIST of ALL earned, 
        // and a separate field for 'displayed_expertise', we'd need a schema change.
        // For now, 'pillar_expertise' IS the earned list.
        // So this function might actually be DANGEROUS to call if it shrinks the list?
        // If 'pillar_expertise' stores ALL earned, we should NOT let users reduce it via this action 
        // unless this action is meant to "Toggle Visibility".
        // The prompt says: "Develop a mechanism to grant...".
        // Use Case: User earns 7 pillars, wants to show top 3.
        // Schema only has `pillar_expertise`.
        // Decision: `pillar_expertise` is the SOURCE OF TRUTH for what they ARE.
        // We should NOT let them "update" it manually anymore. It's system managed.
        // I will throw an error or depreciate this.

        throw new Error("Pillar expertise is now automatically awarded based on your contributions.");

        // Historic code commented out for reference in case we revert
        /*
        await sql`
          UPDATE profiles
          SET pillar_expertise = ${sql.json(selectedPillars)}
          WHERE id = ${user.id}
        `;

        revalidatePath(`/u/${user.username}`);
        revalidatePath("/community");

        return { success: true, pillars: selectedPillars };
        */
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
