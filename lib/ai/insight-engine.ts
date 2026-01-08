import { getGemmaClient } from "./gemma-client";

/**
 * Technical Insights Synthesizer
 * Transforms high-level expert commentary into concise, professional summaries.
 */
export async function generateInsight(commentText: string): Promise<string | null> {
    // Gate: Only process comments with enough substance (except for SMEs, but this function just handles the text)
    // The calling function should handle the SME/Upvote gates.
    // We still want a sanity check on length here to avoid wasting tokens on "lol"
    if (!commentText || commentText.length < 50) {
        return null;
    }

    try {
        const gemma = getGemmaClient();

        const prompt = `You are the Technical Insights Synthesizer. Your task is to extract the core value from verified Subject Matter Expert (SME) comments.

Objective: Transform high-level expert commentary into a concise, professional summary that emphasizes the "Key Takeaway" or "Actionable Insight."

Strict Guidelines:
1. Focus on Substance: Ignore introductory pleasantries. Jump straight to the technical insight.
2. Professional Tone: Use authoritative, objective language.
3. Clutter-Free: If the input lacks a concrete insight, return: "Insight: General expert agreement."
4. Format: Return a single bullet point starting with a bolded keyword.
5. Example: **Infrastructure**: Recommends horizontal scaling over vertical for this specific database architecture.
6. Length: Maximum 30 words.

Comment: "${commentText}"

Response:`;

        // Use 'gemini-2.0-flash' explicitly or undefined for default (default is gemini-2.0-flash now)
        const response = await gemma.generateText('gemini-2.0-flash', prompt, {
            temperature: 0.5,
            maxTokens: 60,
        });

        const insight = response.trim();

        // Sanity check the output
        if (!insight || insight.length < 5) {
            return null;
        }

        return insight;
    } catch (error) {
        console.error("Error generating insight:", error);
        // Don't crash the app if AI fails, just return null
        return null;
    }
}
