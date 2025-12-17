import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VibeCheckResult {
  isSafe: boolean;
  reason: string;
}

/**
 * Checks if content is safe and appropriate for the community
 * Returns { isSafe: boolean, reason: string }
 */
export async function checkVibe(content: string): Promise<VibeCheckResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set - BLOCKING for safety");
    // FAIL CLOSED: If API key is missing, block content
    return { isSafe: false, reason: "Moderation system not configured - content blocked for safety" };
  }
  
  console.log("Starting vibe check with API key:", process.env.OPENAI_API_KEY.substring(0, 10) + "...");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an automated content filter. Your ONLY job is to detect profanity, vulgarity, and inappropriate language. 

Return JSON: { "isSafe": boolean, "reason": string }

MANDATORY RULES - You MUST return isSafe: false if the text contains:
- ANY swear words: shit, ass, damn, hell, fuck, bitch, crap, etc.
- ANY profanity or vulgarity
- Hate speech or discrimination
- Threats or violence
- Sexual content
- Personal attacks
- Health misinformation

EXAMPLES:
- "This product is shit" → isSafe: false
- "What the hell is this?" → isSafe: false  
- "This didn't work, ass" → isSafe: false
- "This protocol helped me sleep" → isSafe: true

If you see ANY swear words, profanity, or inappropriate language, you MUST return:
{ "isSafe": false, "reason": "Contains inappropriate language or profanity" }

ONLY return isSafe: true if the text is completely clean and professional.

Respond with JSON only:
{ "isSafe": true/false, "reason": "brief explanation" }`,
        },
        {
          role: "user",
          content: `Review this content: "${content}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content?.trim();
    console.log("Raw OpenAI response:", resultText);
    
    if (!resultText) {
      console.error("No response from OpenAI - BLOCKING for safety");
      return { isSafe: false, reason: "Moderation API did not respond - content blocked for safety" };
    }

    let result: VibeCheckResult;
    try {
      result = JSON.parse(resultText) as VibeCheckResult;
      console.log("Parsed AI Moderation Response:", result);
      
      // Validate the response structure
      if (typeof result.isSafe !== 'boolean') {
        console.error("Invalid response format - isSafe is not boolean:", result);
        return { isSafe: false, reason: "Invalid moderation response - content blocked for safety" };
      }
      
      return result;
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.error("Raw response that failed to parse:", resultText);
      return { isSafe: false, reason: "Failed to parse moderation response - content blocked for safety" };
    }
  } catch (error) {
    console.error("Error in vibe check:", error);
    // FAIL CLOSED: If API fails, block the content for safety
    return { isSafe: false, reason: "Moderation API error - content blocked for safety" };
  }
}


