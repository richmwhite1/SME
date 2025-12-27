"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

interface SignaledItem {
  id: string;
  content: string;
  type: 'discussion' | 'product';
  raise_hand_count: number;
  created_at: string;
  author_name: string | null;
  author_username: string | null;
  discussion_id?: string;
  discussion_slug?: string;
  discussion_title?: string;
  product_id?: string;
  product_slug?: string;
  product_title?: string;
  has_sme_reply: boolean;
}

/**
 * Fetch all signaled comments/resources sorted by signal count
 */
export async function getSignaledItems() {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const sql = getDb();

  try {
    // Verify user is SME
    const profile = await sql`
      SELECT is_sme, badge_type 
      FROM profiles 
      WHERE id = ${user.id}
    `;

    const isSME = profile[0]?.is_sme || profile[0]?.badge_type === 'Trusted Voice';
    if (!isSME) {
      return { success: false, error: "SME access required" };
    }

    // Fetch discussion comments with signals
    const discussionComments = await sql`
      SELECT 
        dc.id,
        dc.content,
        dc.raise_hand_count,
        dc.created_at,
        dc.discussion_id,
        d.slug as discussion_slug,
        d.title as discussion_title,
        p.full_name as author_name,
        p.username as author_username,
        EXISTS(
          SELECT 1 FROM discussion_comments dc2
          JOIN profiles p2 ON dc2.author_id = p2.id
          WHERE dc2.parent_id = dc.id
          AND (p2.is_verified_expert = true OR p2.badge_type = 'Trusted Voice')
        ) as has_sme_reply
      FROM discussion_comments dc
      LEFT JOIN discussions d ON dc.discussion_id = d.id
      LEFT JOIN profiles p ON dc.author_id = p.id
      WHERE dc.raise_hand_count > 0
      AND (dc.is_flagged IS FALSE OR dc.is_flagged IS NULL)
      ORDER BY dc.raise_hand_count DESC, dc.created_at DESC
      LIMIT 50
    `;

    // Fetch product comments with signals
    const productComments = await sql`
      SELECT 
        pc.id,
        pc.content,
        pc.raise_hand_count,
        pc.created_at,
        pc.product_id,
        pr.slug as product_slug,
        pr.title as product_title,
        p.full_name as author_name,
        p.username as author_username,
        EXISTS(
          SELECT 1 FROM product_comments pc2
          JOIN profiles p2 ON pc2.author_id = p2.id
          WHERE pc2.parent_id = pc.id
          AND (p2.is_verified_expert = true OR p2.badge_type = 'Trusted Voice')
        ) as has_sme_reply
      FROM product_comments pc
      LEFT JOIN products pr ON pc.product_id = pr.id
      LEFT JOIN profiles p ON pc.author_id = p.id
      WHERE pc.raise_hand_count > 0
      AND (pc.is_flagged IS FALSE OR pc.is_flagged IS NULL)
      ORDER BY pc.raise_hand_count DESC, pc.created_at DESC
      LIMIT 50
    `;

    // Combine and format results
    const items: SignaledItem[] = [
      ...discussionComments.map(c => ({
        id: c.id,
        content: c.content,
        type: 'discussion' as const,
        raise_hand_count: c.raise_hand_count || 0,
        created_at: c.created_at,
        author_name: c.author_name,
        author_username: c.author_username,
        discussion_id: c.discussion_id,
        discussion_slug: c.discussion_slug,
        discussion_title: c.discussion_title,
        has_sme_reply: c.has_sme_reply || false
      })),
      ...productComments.map(c => ({
        id: c.id,
        content: c.content,
        type: 'product' as const,
        raise_hand_count: c.raise_hand_count || 0,
        created_at: c.created_at,
        author_name: c.author_name,
        author_username: c.author_username,
        product_id: c.product_id,
        product_slug: c.product_slug,
        product_title: c.product_title,
        has_sme_reply: c.has_sme_reply || false
      }))
    ];

    // Sort combined results by signal count
    items.sort((a, b) => b.raise_hand_count - a.raise_hand_count);

    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching signaled items:", error);
    return { success: false, error: "Failed to fetch signaled items" };
  }
}

/**
 * Fetch signaled items that need expert attention (no SME reply yet)
 */
export async function getSignaledItemsNeedingExpert() {
  const result = await getSignaledItems();

  if (!result.success || !result.data) {
    return result;
  }

  // Filter out items that already have SME replies
  const needingExpert = result.data.filter(item => !item.has_sme_reply);

  return { success: true, data: needingExpert };
}

/**
 * Get weekly stats for SME user
 */
export async function getWeeklySMEStats(userId: string) {
  const sql = getDb();

  try {
    // Get count of official responses in the past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const discussionCount = await sql`
      SELECT COUNT(*) as count
      FROM discussion_comments
      WHERE author_id = ${userId}
      AND is_official_response = true
      AND created_at >= ${weekAgo.toISOString()}
    `;

    const productCount = await sql`
      SELECT COUNT(*) as count
      FROM product_comments
      WHERE author_id = ${userId}
      AND is_official_response = true
      AND created_at >= ${weekAgo.toISOString()}
    `;

    const totalHelped = (discussionCount[0]?.count || 0) + (productCount[0]?.count || 0);

    return { success: true, data: { helpedThisWeek: totalHelped } };
  } catch (error) {
    console.error("Error fetching SME stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
