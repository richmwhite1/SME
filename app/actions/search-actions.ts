"use server";

// Ensure environment variables are loaded for server actions
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getDb } from "@/lib/db";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export type SearchFilterMode = 'verified' | 'community' | 'holistic';

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

/**
 * Semantic Search with LLM Query Expansion and Filter Modes
 */
export async function searchSemantic(
  userQuery: string,
  filterMode: SearchFilterMode = 'holistic',
  limit: number = 20
): Promise<SearchResult[]> {
  if (!userQuery || userQuery.trim().length < 2) {
    return [];
  }

  try {
    // Level 1: Direct Keyword Search
    const directResultsPromise = searchGlobal(userQuery, limit);
    let expandedResults: SearchResult[] = [];

    // Level 2: LLM Expansion (Optional)
    // Only attempt if API key is present
    if (process.env.OPENAI_API_KEY) {
      try {
        const expandedQuery = await expandQueryWithLLM(userQuery);
        console.log(`[Search] Expanded "${userQuery}" to "${expandedQuery}"`);

        // Only run secondary search if query was actually expanded
        if (expandedQuery && expandedQuery.toLowerCase() !== userQuery.toLowerCase()) {
          expandedResults = await searchGlobal(expandedQuery, limit);
        }
      } catch (llmError) {
        console.warn("LLM expansion failed, proceeding with keyword search only:", llmError);
      }
    }

    const directResults = await directResultsPromise;

    // Merge: Prioritize direct keyword matches
    const combined = new Map<string, SearchResult>();

    // 1. Add direct results first
    directResults.forEach(r => combined.set(r.result_id, r));

    // 2. Add expanded results if not already present
    expandedResults.forEach(r => {
      if (!combined.has(r.result_id)) {
        combined.set(r.result_id, r);
      }
    });

    let results = Array.from(combined.values());

    // Apply filter mode
    if (filterMode === 'verified') {
      // Filter to SME-certified products only
      results = results.filter(r =>
        r.result_type === 'Product' && r.is_sme_certified === true
      );
    } else if (filterMode === 'community') {
      // Filter to discussions and reviews only
      results = results.filter(r =>
        r.result_type === 'Discussion' || r.result_type === 'Review'
      );
    }
    // 'holistic' mode returns all results (no filtering)

    return results.slice(0, limit);

  } catch (error) {
    console.error("Semantic search error:", error);
    // Fallback to basic global search if anything catastrophic happens
    return searchGlobal(userQuery, limit);
  }
}

/**
 * Expands a user query into search terms using GPT-4o-mini
 */
async function expandQueryWithLLM(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a query expansion assistant for a health product search engine. Your goal is to take a user's symptom, goal, or term (e.g., 'sleep', 'tired', 'gut health') and expand it into a list of related scientific, biological, and product-category keywords. Return ONLY a space-separated string of the most relevant 3-5 keywords, including the original term. Do not use 'OR' or boolean operators, just words. Example input: 'sleep'. Example output: 'sleep melatonin magnesium insomnia circadian'."
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const expanded = response.choices[0]?.message?.content?.trim();
    return expanded || query;
  } catch (error) {
    console.error("LLM expansion error:", error);
    return query; // Fallback to original query
  }
}
