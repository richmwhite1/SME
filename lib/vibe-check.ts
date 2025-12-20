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

/**
 * Checks if guest comment content is constructive and relevant for technical discussions
 * Uses a stricter prompt focused on quality and relevance
 * Returns { isSafe: boolean, reason: string }
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
          content: `You are a content moderator for a technical discussion platform. Your job is to evaluate if a comment is constructive and relevant to technical discussions.

Return JSON: { "isSafe": boolean, "reason": string }

MANDATORY RULES - You MUST return isSafe: false if the text:
- Is spam, promotional, or self-promotional
- Contains toxicity, hate speech, or harassment
- Is low-effort or generic (e.g., "nice", "cool", "thanks", "lol", "this", "same")
- Is off-topic or irrelevant to technical discussion
- Contains profanity, vulgarity, or inappropriate language
- Is a personal attack or aggressive
- Contains health misinformation or unverified claims
- Is too short to be meaningful (< 10 words of actual content)

EXAMPLES OF REJECTIONS:
- "nice product" → isSafe: false (low-effort, generic)
- "this is spam" → isSafe: false (spam)
- "buy my product at..." → isSafe: false (promotional)
- "you're an idiot" → isSafe: false (personal attack)
- "this sucks" → isSafe: false (low-effort, not constructive)

EXAMPLES OF ACCEPTANCES:
- "I've been using this protocol for 3 months and noticed improved sleep quality. The magnesium content seems well-absorbed." → isSafe: true (constructive, specific)
- "Has anyone tested this with a different dosage? I'm curious about the bioavailability." → isSafe: true (relevant question)
- "The study cited here shows promising results, but I'd like to see more long-term data." → isSafe: true (constructive feedback)

ONLY return isSafe: true if the comment is:
- Constructive and adds value to the discussion
- Relevant to the technical topic
- Substantive (not generic or low-effort)
- Professional and appropriate

Respond with JSON only:
{ "isSafe": true/false, "reason": "brief explanation" }`,
        },
        {
          role: "user",
          content: `Is this comment constructive and relevant to a technical discussion? Review: "${content}"`,
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


