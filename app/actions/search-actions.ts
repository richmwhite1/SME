"use server";

// Ensure environment variables are loaded for server actions
import { getDb } from "@/lib/db";

// Remove OpenAI import and usage as they are not used in this file
// Search is purely SQL-based here.

interface SearchResult {
  result_type: "Product" | "Discussion" | "Resource" | "Evidence" | "Review";
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
  score_scientific?: number;
  score_alternative?: number;
  score_esoteric?: number;
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
import { getGemmaClient } from "@/lib/ai/gemma-client";

// ... existing imports

export interface SearchResponse {
  results: SearchResult[];
  synthesis?: string | null;
}

export async function searchGlobal(
  query: string,
  limit: number = 10
): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [] };
  }

  const sql = getDb();
  let results: SearchResult[] = [];

  try {
    // Call the global_search PostgreSQL function
    const dbResults = await sql`
      SELECT * FROM global_search(${query.trim()}, ${limit})
    `;
    results = dbResults as unknown as SearchResult[];

  } catch (error) {
    console.error("Search error:", error);
    // Don't fail completely if DB search fails, still try AI? No, probably return empty.
    results = [];
  }

  // --- AI Synthesis Layer ---
  let synthesis: string | null = null;
  // Only synthesize if query is a question or long enough to be an intent
  // And usually if we have results, or if we want to answer "zero result" queries too.
  // Let's answer "zero result" queries too if they are health questions.
  const isQuestion = query.includes("?") || query.length > 10;

  if (isQuestion || results.length > 0) {
    try {
      const gemma = getGemmaClient();
      const context = results.slice(0, 3).map(r => `${r.title}: ${r.content_snippet || r.snippet || r.content.substring(0, 100)}`).join("\n");

      const prompt = `User Query: "${query}"
          
          Context from our database (if any):
          ${context}
          
          Task: Provide a helpful, concise (1-2 sentences) answer or intent clarification for the user. 
          If the database context is relevant, use it. If not, provide general high-level health knowledge (safe, non-medical advice).
          
          Answer:`;

      // Fire and forget-ish, but here we await because we want to show it.
      // In a real app we might stream this, but for now simple await.
      const aiRes = await gemma.generateText('gemini-2.0-flash', prompt, { maxTokens: 100 });
      synthesis = aiRes.trim();
    } catch (e) {
      console.error("AI Synthesis failed:", e);
    }
  }

  return { results, synthesis };
}

/**
 * Legacy lens search (kept for backward compatibility if needed, but redundant with new system)
 */
export async function searchProductsByLens(
  query: string,
  lens: 'scientific' | 'ancestral' | 'esoteric',
  limit: number = 20
): Promise<LensSearchResult[]> {
  const sql = getDb();
  try {
    const results = await sql<LensSearchResult[]>`
      SELECT * FROM search_products_by_lens(${query}, ${lens}, ${limit})
    `;
    return results;
  } catch (error) {
    console.error("Lens search error:", error);
    return [];
  }
}




