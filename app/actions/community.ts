"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type CommunityUser = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
  contributor_score: number;
  badge_type: string | null;
  is_verified_expert: boolean;
  chakra_level: number;
  sme_score: number;
  pillar_expertise: string[];
  top_tags: string[];
  is_following: boolean;
  is_mutual: boolean;
  last_active_at: Date | null;
  is_online: boolean;
};

export async function getCommunityUsers({
  query,
  filter,
  pillars,
  limit = 20,
  offset = 0,
}: {
  query?: string;
  filter?: "all" | "sme" | "following";
  pillars?: string[];
  limit?: number;
  offset?: number;
}) {
  try {
    const user = await currentUser();
    const currentUserId = user ? user.id : null;

    const sql = getDb();
    let searchClause = sql``;
    if (query) {
      const searchPattern = `%${query}%`;
      searchClause = sql`AND (
        full_name ILIKE ${searchPattern} OR 
        username ILIKE ${searchPattern} OR 
        bio ILIKE ${searchPattern} OR
        profession ILIKE ${searchPattern}
      )`;
    }

    let filterClause = sql``;
    if (filter === "sme") {
      filterClause = sql`AND is_verified_expert = true`;
    } else if (filter === "following") {
      if (!currentUserId) {
        return []; // Cannot filter by following if not logged in
      }
      // Only show users that the current user follows
      filterClause = sql`AND id IN (
        SELECT following_id FROM follows WHERE follower_id = ${currentUserId}
      )`;
    }

    // Pillar filtering (JSONB array overlap)
    // Pillar filtering (JSONB array overlap)
    let pillarClause = sql``;
    if (pillars && pillars.length > 0) {
      // Validate pillars against known list to prevent any weirdness
      // Although parameterization handles safety, this is good practice
      // We accept strings, but the SQL query will treat them as a text array for comparison

      // Use efficient JSONB operator ?| (exists any)
      // We pass the string array directly to postgres(), it handles the serialization safely
      pillarClause = sql`AND pillar_expertise ?| ${sql.array(pillars)}`;
    }

    // Activity Threshold (15 mins for green dot)
    const ONLINE_THRESHOLD_MINUTES = 15;

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
        p.chakra_level,
        p.sme_score,
        p.pillar_expertise,
        p.last_active_at,
        ${currentUserId
        ? sql`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = p.id) as is_following`
        : sql`false as is_following`
      },
        ${currentUserId
        ? sql`EXISTS(SELECT 1 FROM follows WHERE follower_id = p.id AND following_id = ${currentUserId}) as is_followed_by`
        : sql`false as is_followed_by`
      },
        p.tags as top_tags
      FROM profiles p
      WHERE 1=1
      ${searchClause}
      ${filterClause}
      ${pillarClause}
      ORDER BY p.last_active_at DESC NULLS LAST, p.sme_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Normalize data
    return users.map((u: any) => {
      const lastActive = u.last_active_at ? new Date(u.last_active_at) : null;
      const isOnline = lastActive
        ? (new Date().getTime() - lastActive.getTime()) < (ONLINE_THRESHOLD_MINUTES * 60 * 1000)
        : false;

      return {
        ...u,
        chakra_level: u.chakra_level || 1,
        sme_score: parseFloat(u.sme_score) || 0,
        pillar_expertise: Array.isArray(u.pillar_expertise) ? u.pillar_expertise : (u.pillar_expertise ? JSON.parse(u.pillar_expertise) : []),
        is_following: !!u.is_following, // Ensure boolean
        is_mutual: !!u.is_following && !!u.is_followed_by, // Mutual = I follow them AND they follow me
        is_online: isOnline,
        top_tags: u.top_tags || []
      };
    }) as CommunityUser[];
  } catch (error) {
    console.error("Error in getCommunityUsers:", error);
    return [];
  }
}

export async function followUser(targetUserId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const sql = getDb();
  await sql`
    INSERT INTO follows (follower_id, following_id)
    VALUES (${user.id}, ${targetUserId})
    ON CONFLICT (follower_id, following_id) DO NOTHING
  `;

  revalidatePath("/community");
  revalidatePath(`/u/${user.username}`);
  return { success: true };
}

export async function unfollowUser(targetUserId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const sql = getDb();
  await sql`
    DELETE FROM follows 
    WHERE follower_id = ${user.id} AND following_id = ${targetUserId}
  `;

  revalidatePath("/community");
  revalidatePath(`/u/${user.username}`);
  return { success: true };
}
