"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Uses OpenAI Moderation API to check if content violates policies
 * Returns { isFlagged: boolean, categories: string[] }
 */
export async function moderateContent(content: string): Promise<{
  isFlagged: boolean;
  categories: string[];
}> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set - BLOCKING for safety");
    return { isFlagged: true, categories: ["moderation_unavailable"] };
  }

  try {
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    
    if (!result) {
      console.error("No moderation result returned - BLOCKING for safety");
      return { isFlagged: true, categories: ["moderation_error"] };
    }

    // Extract flagged categories
    const flaggedCategories: string[] = [];
    if (result.categories) {
      Object.entries(result.categories).forEach(([category, flagged]) => {
        if (flagged) {
          flaggedCategories.push(category);
        }
      });
    }

    return {
      isFlagged: result.flagged || false,
      categories: flaggedCategories,
    };
  } catch (error) {
    console.error("Error in OpenAI moderation:", error);
    // FAIL CLOSED: If API fails, block the content for safety
    return { isFlagged: true, categories: ["moderation_error"] };
  }
}


