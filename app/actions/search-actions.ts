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

export interface LensSearchResult {
  id: string;
  title: string;
  slug: string;
  problem_solved: string | null;
  images: string[] | null;
  score_scientific: number;
  score_alternative: number;
  score_esoteric: number;
  is_sme_certified: boolean;
  third_party_lab_verified: boolean;
  source_transparency: boolean;
  rank: number;
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

/**
 * Server action for lens-aware product search
 */
export async function searchProductsByLens(
  query: string,
  lens: 'scientific' | 'ancestral' | 'esoteric',
  limit: number = 20
): Promise<LensSearchResult[]> {
  const sql = getDb();
  try {
    // Determine the lens value to pass to Postgres
    // Postgres function expects 'scientific', 'ancestral', 'esoteric'
    const results = await sql<LensSearchResult[]>`
      SELECT * FROM search_products_by_lens(${query}, ${lens}, ${limit})
    `;
    return results;
  } catch (error) {
    console.error("Lens search error:", error);
    return [];
  }
}
