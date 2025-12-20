"use server";

import { getDb } from "@/lib/db";

export async function getResources() {
  const sql = getDb();
  try {
    const resources = await sql`
      SELECT *
      FROM resource_library
    `;
    return { success: true, data: resources };
  } catch (error) {
    console.error("Error fetching resources:", error);
    return { success: false, error: "Failed to fetch resources" };
  }
}

export async function getUserBadge(userId: string) {
  const sql = getDb();
  try {
    const result = await sql`
      SELECT badge_type
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `;
    return { success: true, badge_type: result[0]?.badge_type };
  } catch (error) {
    console.error("Error fetching user badge:", error);
    return { success: false, error: "Failed to fetch user badge" };
  }
}

export async function searchResources(query: string) {
  const sql = getDb();
  try {
    const resources = await sql`
      SELECT origin_id, title, reference_url
      FROM resource_library
      WHERE title ILIKE ${'%' + query + '%'}
      LIMIT 10
    `;
    return { success: true, data: resources };
  } catch (error) {
    console.error("Error searching resources:", error);
    return { success: false, error: "Failed to search resources" };
  }
}
