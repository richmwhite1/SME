"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

/**
 * Recalculate a user's reputation score from all upvotes
 * This will trigger the is_sme status update automatically via database trigger
 */
export async function recalculateUserReputation(userId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    const sql = getDb();

    try {
        // Call the database function to recalculate and update reputation
        const result = await sql`
      SELECT * FROM recalculate_and_update_reputation(${userId})
    `;

        if (result.length === 0) {
            return { success: false, error: "User not found" };
        }

        const data = result[0];

        return {
            success: true,
            data: {
                userId: data.user_id,
                oldReputation: data.old_reputation,
                newReputation: data.new_reputation,
                oldSmeStatus: data.old_sme_status,
                newSmeStatus: data.new_sme_status,
                statusChanged: data.old_sme_status !== data.new_sme_status,
            },
        };
    } catch (error: any) {
        console.error("Error recalculating reputation:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get SME status change history for a user
 */
export async function getSMEStatusHistory(userId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    const sql = getDb();

    try {
        const history = await sql`
      SELECT 
        action,
        details,
        created_at
      FROM admin_logs
      WHERE admin_id = ${userId}
      AND action IN ('sme_promoted', 'sme_demoted')
      ORDER BY created_at DESC
      LIMIT 50
    `;

        return { success: true, data: history };
    } catch (error: any) {
        console.error("Error fetching SME status history:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin function to seed a test user with upvotes to reach target reputation
 * This is for testing the SME promotion system
 */
export async function seedUserReputation(
    email: string,
    targetScore: number = 100
) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    const sql = getDb();

    try {
        // Verify admin status
        const profile = await sql`
      SELECT is_admin FROM profiles WHERE id = ${user.id}
    `;

        if (!profile[0]?.is_admin) {
            return { success: false, error: "Admin access required" };
        }

        // Find target user by email
        const targetUser = await sql`
      SELECT id, full_name, reputation_score, is_sme
      FROM profiles
      WHERE email = ${email}
    `;

        if (targetUser.length === 0) {
            return { success: false, error: `User not found: ${email}` };
        }

        const targetUserId = targetUser[0].id;
        const currentReputation = targetUser[0].reputation_score || 0;

        // Calculate how many upvotes we need to add
        const upvotesNeeded = Math.max(0, targetScore - currentReputation);

        if (upvotesNeeded === 0) {
            return {
                success: true,
                message: `User already has reputation score of ${currentReputation}`,
                data: {
                    userId: targetUserId,
                    email,
                    currentReputation,
                    isSme: targetUser[0].is_sme,
                },
            };
        }

        // Create a test discussion for the user if they don't have one
        const existingDiscussions = await sql`
      SELECT id FROM discussions WHERE author_id = ${targetUserId} LIMIT 1
    `;

        let discussionId;

        if (existingDiscussions.length === 0) {
            // Create a test discussion
            const newDiscussion = await sql`
        INSERT INTO discussions (
          title,
          content,
          author_id,
          slug,
          tags
        ) VALUES (
          'Test Discussion for Reputation Seeding',
          'This is a test discussion created to seed reputation for SME testing.',
          ${targetUserId},
          'test-discussion-' || ${targetUserId} || '-' || extract(epoch from now())::text,
          ARRAY['Testing']
        )
        RETURNING id
      `;
            discussionId = newDiscussion[0].id;
        } else {
            discussionId = existingDiscussions[0].id;
        }

        // Create mock users to vote (we'll use a system user ID)
        const mockVoterIds: string[] = [];
        for (let i = 0; i < upvotesNeeded; i++) {
            mockVoterIds.push(`mock_voter_${i}_${Date.now()}`);
        }

        // Insert mock profiles for voters
        for (const voterId of mockVoterIds) {
            await sql`
        INSERT INTO profiles (id, full_name, email)
        VALUES (
          ${voterId},
          'Mock Voter',
          ${voterId}::text || '@test.com'
        )
        ON CONFLICT (id) DO NOTHING
      `;
        }

        // Add upvotes from mock users
        let votesAdded = 0;
        for (const voterId of mockVoterIds) {
            try {
                await sql`
          INSERT INTO discussion_votes (user_id, discussion_id)
          VALUES (${voterId}, ${discussionId})
          ON CONFLICT (user_id, discussion_id) DO NOTHING
        `;
                votesAdded++;
            } catch (err) {
                console.error(`Failed to add vote from ${voterId}:`, err);
            }
        }

        // Update the discussion's upvote count
        await sql`
      UPDATE discussions
      SET upvote_count = upvote_count + ${votesAdded}
      WHERE id = ${discussionId}
    `;

        // Recalculate the user's reputation (this will trigger is_sme update)
        const reputationResult = await recalculateUserReputation(targetUserId);

        if (!reputationResult.success) {
            return {
                success: false,
                error: "Failed to recalculate reputation after seeding",
            };
        }

        // Get updated user status
        const updatedUser = await sql`
      SELECT reputation_score, is_sme, full_name
      FROM profiles
      WHERE id = ${targetUserId}
    `;

        return {
            success: true,
            message: `Successfully seeded ${votesAdded} upvotes for ${email}`,
            data: {
                userId: targetUserId,
                email,
                name: updatedUser[0].full_name,
                oldReputation: currentReputation,
                newReputation: updatedUser[0].reputation_score,
                isSme: updatedUser[0].is_sme,
                votesAdded,
                discussionId,
            },
        };
    } catch (error: any) {
        console.error("Error seeding user reputation:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current reputation and SME status for a user
 */
export async function getUserReputationStatus(userId: string) {
    const sql = getDb();

    try {
        const result = await sql`
      SELECT 
        id,
        full_name,
        email,
        reputation_score,
        reputation_scientific,
        reputation_experiential,
        reputation_safety,
        reputation_innovation,
        reputation_reliability,
        is_sme,
        is_verified_expert,
        badge_type,
        contributor_score
      FROM profiles
      WHERE id = ${userId}
    `;

        if (result.length === 0) {
            return { success: false, error: "User not found" };
        }

        return { success: true, data: result[0] };
    } catch (error: any) {
        console.error("Error fetching user reputation status:", error);
        return { success: false, error: error.message };
    }
}
