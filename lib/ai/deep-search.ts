import { getGeminiClient } from "./gemini-client";
import { SearchResult } from "@/app/actions/search-actions";

export interface DeepSearchSummary {
    main_answer: string;
    sme_perspective: string;
    community_perspective: string;
    citations: {
        id: string;
        title: string;
        url: string;
        type: string; // 'Product', 'Discussion', 'Evidence'
    }[];
}

/**
 * Generate a deep summary of search results
 * Distinguishing between SME and Community feedback
 */
export async function deepSearch(
    query: string,
    results: SearchResult[]
): Promise<DeepSearchSummary | null> {

    if (!results || results.length === 0) return null;

    const gemini = getGeminiClient();

    // 1. Organize Context
    const smeResults = results.filter(r => r.is_sme_certified || r.author_username === 'SME_Official' || r.result_type === 'Evidence');
    const communityResults = results.filter(r => !smeResults.includes(r));

    // Helper to format context
    const formatContext = (items: SearchResult[]) => {
        return items.map((r, i) =>
            `ID: ${r.result_id} | Type: ${r.result_type} | Title: ${r.title} | Snippet: ${r.content_snippet || r.snippet || r.content.substring(0, 200)}`
        ).join('\n---\n');
    };

    const smeContext = formatContext(smeResults.slice(0, 5));
    const communityContext = formatContext(communityResults.slice(0, 5));

    // 2. Build Prompt
    const prompt = `
    User Query: "${query}"

    --- SME / CLINICAL / EXPERT CONTEXT ---
    ${smeContext || "No specific SME data available."}

    --- COMMUNITY / ANECDOTAL CONTEXT ---
    ${communityContext || "No specific community data available."}

    --- INSTRUCTIONS ---
    Analyze the contexts above to answer the user's query.
    1. **Main Answer**: Direct answer to the question (2-3 sentences).
    2. **SME Perspective**: Summarize what the experts, clinical evidence, or certified products say. Focus on facts, mechanisms, and safety.
    3. **Community Perspective**: Summarize anecdotal experiences, discussions, and reviews. Focus on user sentiment and real-world effects.
    4. **Citations**: List the Result IDs used for each point.

    Return JSON format only:
    {
      "main_answer": "...",
      "sme_perspective": "...",
      "community_perspective": "...",
      "used_result_ids": ["ID1", "ID2"]
    }
    `;

    try {
        const response = await gemini.generateText('gemini-2.0-flash-exp', prompt, {
            jsonMode: true,
            maxTokens: 1000,
            temperature: 0.2
        });

        // Parse JSON
        let jsonStr = response.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(jsonStr);

        // Map used IDs back to citations
        const citations = results
            .filter(r => data.used_result_ids?.includes(r.result_id))
            .map(r => {
                let url = '';
                if (r.result_type === 'Product') url = `/products/${r.result_id}`;
                else if (r.result_type === 'Discussion') url = `/community/${r.result_slug || r.result_id}`;
                else url = `/resources`; // Fallback

                return {
                    id: r.result_id,
                    title: r.title,
                    url: url,
                    type: r.result_type
                };
            });

        return {
            main_answer: data.main_answer,
            sme_perspective: data.sme_perspective,
            community_perspective: data.community_perspective,
            citations: citations
        };

    } catch (error) {
        console.error("Deep Search failed:", error);
        return null; // Fallback to no summary
    }
}
