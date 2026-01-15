import { getGeminiClient } from './gemini-client';
import { getCredibilityContext } from './credibility-scorer';

/**
 * Gemini-powered Vibe Check
 * Replaces OpenAI-based content moderation with Gemini Flash
 */

export interface VibeCheckResult {
    isSafe: boolean;
    reason: string;
    confidence?: 'high' | 'low';
    credibilityAdjusted?: boolean;
}

/**
 * Check if content is safe and appropriate for the community
 * Uses Gemini with credibility-aware moderation
 */
export async function checkVibe(
    content: string,
    userId?: string
): Promise<VibeCheckResult> {
    if (!process.env.GOOGLE_VERTEX_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
        console.error('AI API Key not set - BLOCKING for safety');
        return {
            isSafe: false,
            reason: 'Moderation system not configured - content blocked for safety'
        };
    }

    try {
        const client = getGeminiClient();
        const context = await getCredibilityContext(userId);

        const result = await client.moderateContent(content, {
            userId,
            userReputation: context.userReputation,
            isSme: context.isSme,
        });

        console.log('Gemini moderation result:', {
            content: content.substring(0, 50) + '...',
            result,
            context,
        });

        return result;
    } catch (error) {
        console.error('Error in Gemini vibe check:', error);
        // FAIL CLOSED: If API fails, block the content for safety
        return {
            isSafe: false,
            reason: 'Moderation API error - content blocked for safety'
        };
    }
}

/**
 * Check if guest comment content is safe
 * Context-aware moderation for health science platform
 */
export async function checkVibeForGuest(
    content: string,
    productId?: string
): Promise<VibeCheckResult> {
    if (!process.env.GOOGLE_VERTEX_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
        console.error('AI API Key not set - BLOCKING for safety');
        return {
            isSafe: false,
            reason: 'Moderation system not configured - content blocked for safety'
        };
    }

    try {
        const client = getGeminiClient();
        const context = await getCredibilityContext(undefined, productId);

        const result = await client.moderateContent(content, {
            isVerifiedProduct: context.isVerifiedProduct,
        });

        console.log('Gemini guest moderation result:', {
            content: content.substring(0, 50) + '...',
            result,
            productId,
            isVerifiedProduct: context.isVerifiedProduct,
        });

        return result;
    } catch (error) {
        console.error('Error in Gemini guest vibe check:', error);
        return {
            isSafe: false,
            reason: 'Moderation API error - content blocked for safety'
        };
    }
}
