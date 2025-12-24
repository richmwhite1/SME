import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are the Technical Insights Synthesizer. Your task is to extract the core value from verified Subject Matter Expert (SME) comments.

Objective: Transform high-level expert commentary into a concise, professional summary that emphasizes the "Key Takeaway" or "Actionable Insight."

Strict Guidelines:
Focus on Substance: Ignore introductory pleasantries. Jump straight to the technical insight.
Professional Tone: Use authoritative, objective language.
Clutter-Free: If the input lacks a concrete insight, return: "Insight: General expert agreement."
Format: Return a single bullet point starting with a bolded keyword.
Example: **Infrastructure**: Recommends horizontal scaling over vertical for this specific database architecture.
Length: Maximum 30 words.`
                },
                {
                    role: "user",
                    content: commentText
                }
            ],
            temperature: 0.5,
            max_tokens: 60,
        });

        const insight = response.choices[0]?.message?.content?.trim();

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
