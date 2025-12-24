import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import ExpertProfileWizard from "@/components/intake/ExpertProfileWizard";

export const dynamic = "force-dynamic";

/**
 * Expert Profile Wizard Page
 * 
 * This page is shown to users who have reached 100+ reputation (needs_sme_review = true)
 * and haven't completed their expert profile yet (has_completed_expert_profile = false).
 * 
 * After completion, users are redirected to their profile and the application
 * is submitted for admin review.
 */
export default async function ExpertProfilePage() {
    // Get current user from Clerk
    const user = await currentUser();
    if (!user) {
        redirect("/");
    }

    const sql = getDb();

    try {
        // Fetch user's profile to check eligibility
        const result = await sql`
            SELECT 
                needs_sme_review,
                has_completed_expert_profile,
                reputation_score
            FROM profiles
            WHERE id = ${user.id}
            LIMIT 1
        `;

        if (!result || result.length === 0) {
            // Profile doesn't exist, redirect to home
            redirect("/");
        }

        const profile = result[0];

        // Check if user is eligible for expert profile wizard
        if (!profile.needs_sme_review) {
            // User hasn't reached 100+ reputation yet
            redirect("/u/me");
        }

        if (profile.has_completed_expert_profile) {
            // User has already completed the wizard
            redirect("/u/me");
        }

        // User is eligible - show the wizard
        return (
            <div>
                <ExpertProfileWizard />
            </div>
        );
    } catch (error) {
        console.error("Error fetching user profile:", error);
        redirect("/");
    }
}
