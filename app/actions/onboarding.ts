"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { CommunityUser } from "./community";

export async function getRecommendedUsers(pillars: string[]) {
    const user = await currentUser();
    const currentUserId = user?.id;

    if (!pillars || pillars.length === 0) {
        return [];
    }

    const sql = getDb();

    // Logic: Users who are SMEs (is_verified_expert) + Have tags matching the selected pillars
    const users = await sql`
    SELECT 
      p.id,
      p.full_name,
      p.username,
      p.avatar_url,
      p.bio,
      p.profession,
      p.contributor_score,
      p.badge_type,
      p.is_verified_expert,
      p.last_active_at,
      p.tags as top_tags,
      ${currentUserId
            ? sql`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = p.id) as is_following`
            : sql`false as is_following`
        }
    FROM profiles p
    WHERE 
      p.is_verified_expert = true
      AND p.tags && ${pillars}
      AND p.id != ${currentUserId || '0'} -- Don't recommend self
    ORDER BY p.contributor_score DESC
    LIMIT 5
  `;

    return users.map((u: any) => ({
        ...u,
        is_following: !!u.is_following,
        is_mutual: false,
        is_online: false, // Not critical for recs
        top_tags: u.top_tags || []
    })) as CommunityUser[];
}

export async function followUsers(targetIds: string[]) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const sql = getDb();

    // Bulk insert
    // Ensure we don't error on duplicates
    for (const id of targetIds) {
        await sql`
       INSERT INTO follows (follower_id, following_id)
       VALUES (${user.id}, ${id})
       ON CONFLICT (follower_id, following_id) DO NOTHING
     `;
    }

    return { success: true };
}

export async function updateUserPillars(pillars: string[]) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const sql = getDb();
    await sql`
     UPDATE profiles 
     SET tags = ${pillars}
     WHERE id = ${user.id}
   `;

    return { success: true };
}
