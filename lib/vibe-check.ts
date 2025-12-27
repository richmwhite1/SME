import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VibeCheckResult {
  isSafe: boolean;
  reason: string;
  confidence?: 'high' | 'low'; // For soft moderation: low = borderline case
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

/**
 * Checks if guest comment content is safe and appropriate for a health science platform
 * Context-aware moderation that allows scientific/technical terminology
 * Returns { isSafe: boolean, reason: string, confidence?: 'high' | 'low' }
 */
export async function checkVibeForGuest(content: string): Promise<VibeCheckResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set - BLOCKING for safety");
    return { isSafe: false, reason: "Moderation system not configured - content blocked for safety" };
  }

  console.log("Starting guest vibe check with API key:", process.env.OPENAI_API_KEY.substring(0, 10) + "...");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nuanced Content Moderator for a health science platform.

Your Goal: Identify hate speech, harassment, and severe profanity.

The Context: Users will discuss chemicals, lab results, potency, and physical effects. Do NOT flag technical, medical, or scientific terminology as 'harmful' or 'dangerous.'

Decision Logic:
- If the text is a personal attack or contains slurs: Return { "isSafe": false, "reason": "Contains hate speech or personal attacks", "confidence": "high" }
- If the text is a technical inquiry, even if it mentions sensitive topics like 'toxins' or 'side effects': Return { "isSafe": true, "reason": "Technical/scientific discussion", "confidence": "high" }
- If the text describes personal health experiences (e.g., "I felt sick", "bad reaction"): Return { "isSafe": true, "reason": "Personal health experience", "confidence": "high" }
- If the text is borderline (could be spam or low-effort but not harmful): Return { "isSafe": true, "reason": "Borderline quality", "confidence": "low" }

EXAMPLES:

APPROVED - Scientific/Technical:
- "What is the chemical potency of this batch? I'm worried about toxicity." → { "isSafe": true, "reason": "Technical inquiry about chemistry", "confidence": "high" }
- "Has anyone tested the bioavailability of this compound?" → { "isSafe": true, "reason": "Scientific question", "confidence": "high" }
- "The heavy metal content concerns me based on the COA." → { "isSafe": true, "reason": "Technical safety concern", "confidence": "high" }

APPROVED - Personal Experience:
- "I had a bad reaction to this, felt very sick." → { "isSafe": true, "reason": "Personal health experience", "confidence": "high" }
- "This gave me headaches after 3 days of use." → { "isSafe": true, "reason": "Personal adverse reaction report", "confidence": "high" }
- "My sleep improved significantly with this protocol." → { "isSafe": true, "reason": "Personal health outcome", "confidence": "high" }

APPROVED - Borderline (Low Confidence):
- "Thanks for sharing this info" → { "isSafe": true, "reason": "Low-effort but polite", "confidence": "low" }
- "Interesting product" → { "isSafe": true, "reason": "Generic but harmless", "confidence": "low" }

REJECTED - Hate Speech/Attacks:
- "You're all idiots, this is garbage" → { "isSafe": false, "reason": "Personal attack and harassment", "confidence": "high" }
- "This company is run by scammers and thieves" → { "isSafe": false, "reason": "Defamatory attack", "confidence": "high" }
- Any racial slurs, hate speech, or severe profanity → { "isSafe": false, "reason": "Contains hate speech", "confidence": "high" }

REJECTED - Spam/Promotional:
- "Buy my product at example.com" → { "isSafe": false, "reason": "Spam/promotional content", "confidence": "high" }
- "Check out my website for better alternatives" → { "isSafe": false, "reason": "Self-promotion", "confidence": "high" }

Respond with JSON only:
{ "isSafe": true/false, "reason": "brief explanation", "confidence": "high/low" }`,
        },
        {
          role: "user",
          content: `Review this content: "${content}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content?.trim();
    console.log("Raw OpenAI guest moderation response:", resultText);

    if (!resultText) {
      console.error("No response from OpenAI - BLOCKING for safety");
      return { isSafe: false, reason: "Moderation API did not respond - content blocked for safety" };
    }

    let result: VibeCheckResult;
    try {
      result = JSON.parse(resultText) as VibeCheckResult;
      console.log("Parsed AI Guest Moderation Response:", result);

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
    console.error("Error in guest vibe check:", error);
    return { isSafe: false, reason: "Moderation API error - content blocked for safety" };
  }
}


