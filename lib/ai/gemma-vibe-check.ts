import { getGemmaClient } from './gemma-client';
import { getCredibilityContext } from './credibility-scorer';

/**
 * Gemma-powered Vibe Check
 * Replaces OpenAI-based content moderation with Gemma 2B
 */

export interface VibeCheckResult {
    isSafe: boolean;
    reason: string;
    confidence?: 'high' | 'low';
    credibilityAdjusted?: boolean;
}

/**
 * Check if content is safe and appropriate for the community
 * Uses Gemma 2B with credibility-aware moderation
 */
export async function checkVibe(
    content: string,
    userId?: string
): Promise<VibeCheckResult> {
    if (!process.env.GOOGLE_AI_API_KEY) {
        console.error('GOOGLE_AI_API_KEY not set - BLOCKING for safety');
        return {
            isSafe: false,
            reason: 'Moderation system not configured - content blocked for safety'
        };
    }

    try {
        const gemma = getGemmaClient();
        const context = await getCredibilityContext(userId);

        const result = await gemma.moderateContent(content, {
            userId,
            userReputation: context.userReputation,
            isSme: context.isSme,
        });

        console.log('Gemma moderation result:', {
            content: content.substring(0, 50) + '...',
            result,
            context,
        });

        return result;
    } catch (error) {
        console.error('Error in Gemma vibe check:', error);
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
    if (!process.env.GOOGLE_AI_API_KEY) {
        console.error('GOOGLE_AI_API_KEY not set - BLOCKING for safety');
        return {
            isSafe: false,
            reason: 'Moderation system not configured - content blocked for safety'
        };
    }

    try {
        const gemma = getGemmaClient();
        const context = await getCredibilityContext(undefined, productId);

        const result = await gemma.moderateContent(content, {
            isVerifiedProduct: context.isVerifiedProduct,
        });

        console.log('Gemma guest moderation result:', {
            content: content.substring(0, 50) + '...',
            result,
            productId,
            isVerifiedProduct: context.isVerifiedProduct,
        });

        return result;
    } catch (error) {
        console.error('Error in Gemma guest vibe check:', error);
        return {
            isSafe: false,
            reason: 'Moderation API error - content blocked for safety'
        };
    }
}
