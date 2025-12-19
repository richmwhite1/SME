"use server";

import { getDb } from "@/lib/db";

interface SearchResult {
  result_type: "Product" | "Discussion" | "Resource" | "Evidence";
  result_id: string;
  result_slug: string;
  title: string;
  content: string;
  snippet?: string | null;
  content_snippet?: string | null;
  created_at: string;
  author_name: string;
  author_username: string | null;
  is_sme_certified: boolean;
  relevance_score: number;
}

/**
 * Server action for global search
 */
export async function searchGlobal(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const sql = getDb();

  try {
    // Call the global_search PostgreSQL function
    const results = await sql`
      SELECT * FROM global_search(${query.trim()}, ${limit})
    `;

    return results as unknown as SearchResult[];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}
