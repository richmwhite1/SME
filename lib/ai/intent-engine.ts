import { getGeminiClient } from './gemini-client';
import { getDb } from '../db/server';

/**
 * Intent Synthesis Engine
 * Extracts intent from natural language queries and synthesizes responses
 * from verified data in the database
 */

export interface IntentExtractionResult {
    topic: string;
    intent: 'health_benefits' | 'product_recommendation' | 'safety_info' | 'general_inquiry';
    keywords: string[];
    confidence: number;
}

export interface DatabaseResults {
    products: Array<{
        id: string;
        title: string;
        slug: string;
        problem_solved: string | null;
        ai_summary: string | null;
        is_sme_certified: boolean;
    }>;
    discussions: Array<{
        id: string;
        title: string;
        slug: string;
        content: string;
        upvote_count: number;
        author_name: string;
        author_is_sme: boolean;
    }>;
}

export interface SynthesizedResponse {
    answer: string;
    sources: Array<{
        type: 'product' | 'discussion';
        id: string;
        title: string;
        url: string;
        excerpt: string;
        credibility: 'sme_certified' | 'sme_authored' | 'community_validated';
    }>;
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Extract intent from natural language query
 */
export async function extractIntent(query: string): Promise<IntentExtractionResult> {
    const gemini = getGeminiClient();
    return await gemini.extractIntent(query);
}

/**
 * Query database for relevant products and discussions
 */
export async function queryDatabase(intent: IntentExtractionResult): Promise<DatabaseResults> {
    const db = getDb();

    // Build search terms
    const searchTerms = [intent.topic, ...intent.keywords].filter(Boolean);
    const searchPattern = searchTerms.join(' | ');

    try {
        // Query products (prioritize SME certified)
        const products = await db`
      SELECT 
        id,
        title,
        slug,
        problem_solved,
        ai_summary,
        is_sme_certified
      FROM products
      WHERE 
        to_tsvector('english', title || ' ' || COALESCE(problem_solved, '') || ' ' || COALESCE(ai_summary, ''))
        @@ to_tsquery('english', ${searchPattern})
      ORDER BY 
        is_sme_certified DESC,
        created_at DESC
      LIMIT 5
    `;

        // Query discussions (prioritize SME authors and high upvotes)
        const discussions = await db`
      SELECT 
        d.id,
        d.title,
        d.slug,
        d.content,
        d.upvote_count,
        p.full_name as author_name,
        COALESCE(p.is_sme, p.is_verified_expert, false) as author_is_sme
      FROM discussions d
      JOIN profiles p ON d.author_id = p.id
      WHERE 
        d.is_flagged = false
        AND (
          to_tsvector('english', d.title || ' ' || d.content)
          @@ to_tsquery('english', ${searchPattern})
        )
      ORDER BY 
        author_is_sme DESC,
        d.upvote_count DESC,
        d.created_at DESC
      LIMIT 5
    `;

        return {
            products: products as any[],
            discussions: discussions as any[],
        };
    } catch (error) {
        console.error('Error querying database:', error);
        return {
            products: [],
            discussions: [],
        };
    }
}

/**
 * Synthesize response from database results
 */
export async function synthesizeResponse(
    query: string,
    intent: IntentExtractionResult,
    dbResults: DatabaseResults
): Promise<SynthesizedResponse> {
    const gemini = getGeminiClient();

    // Build context from database results
    const productContext = dbResults.products
        .map((p, i) => `Product ${i + 1}: ${p.title}${p.is_sme_certified ? ' (SME Certified)' : ''}\n${p.problem_solved || p.ai_summary || ''}`)
        .join('\n\n');

    const discussionContext = dbResults.discussions
        .map((d, i) => `Discussion ${i + 1}: ${d.title}${d.author_is_sme ? ' (by SME)' : ''}\n${d.content.substring(0, 300)}...`)
        .join('\n\n');

    const hasVerifiedSources = dbResults.products.some(p => p.is_sme_certified) ||
        dbResults.discussions.some(d => d.author_is_sme);

    // Generate synthesis prompt
    const prompt = `You are a health science assistant. Answer the user's question using ONLY the verified information provided below.

User Question: "${query}"

Verified Products:
${productContext || 'No verified products found.'}

Community Discussions:
${discussionContext || 'No relevant discussions found.'}

Instructions:
1. Synthesize a clear, concise answer (2-3 sentences max)
2. Only use information from the sources above
3. If no relevant information is found, say "I don't have verified information on this topic yet."
4. Be factual and avoid speculation
5. Mention if information comes from SME-certified sources

Answer:`;

    try {
        const answer = await gemini.generateText('gemini-2.0-flash-exp', prompt, {
            temperature: 0.4,
            maxTokens: 300,
        });

        // Build sources array
        const sources: SynthesizedResponse['sources'] = [
            ...dbResults.products.map(p => ({
                type: 'product' as const,
                id: p.id,
                title: p.title,
                url: `/products/${p.slug}`,
                excerpt: (p.problem_solved || p.ai_summary || '').substring(0, 150) + '...',
                credibility: p.is_sme_certified ? 'sme_certified' as const : 'community_validated' as const,
            })),
            ...dbResults.discussions.map(d => ({
                type: 'discussion' as const,
                id: d.id,
                title: d.title,
                url: `/discussions/${d.slug}`,
                excerpt: d.content.substring(0, 150) + '...',
                credibility: d.author_is_sme ? 'sme_authored' as const : 'community_validated' as const,
            })),
        ];

        // Determine confidence
        let confidence: 'high' | 'medium' | 'low';
        if (hasVerifiedSources && sources.length >= 3) {
            confidence = 'high';
        } else if (sources.length >= 2) {
            confidence = 'medium';
        } else {
            confidence = 'low';
        }

        return {
            answer,
            sources,
            confidence,
        };
    } catch (error) {
        console.error('Error synthesizing response:', error);
        return {
            answer: "I'm having trouble processing your question right now. Please try again later.",
            sources: [],
            confidence: 'low',
        };
    }
}

/**
 * Complete intent synthesis pipeline
 */
export async function processNaturalLanguageQuery(query: string): Promise<SynthesizedResponse> {
    // Extract intent
    const intent = await extractIntent(query);

    // Query database
    const dbResults = await queryDatabase(intent);

    // Synthesize response
    const response = await synthesizeResponse(query, intent, dbResults);

    return response;
}
