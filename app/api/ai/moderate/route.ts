import { NextRequest, NextResponse } from 'next/server';
import { checkVibe, checkVibeForGuest } from '@/lib/ai/gemma-vibe-check';
import { calculateCredibility } from '@/lib/ai/credibility-scorer';

/**
 * POST /api/ai/moderate
 * Moderate content using Gemma with credibility-aware logic
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, userId, productId } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content is required and must be a string' },
                { status: 400 }
            );
        }

        // Get credibility score
        const credibilityScore = await calculateCredibility(userId, productId);

        // Moderate content
        let result;
        if (userId) {
            result = await checkVibe(content, userId);
        } else {
            result = await checkVibeForGuest(content, productId);
        }

        return NextResponse.json({
            isSafe: result.isSafe,
            reason: result.reason,
            confidence: result.confidence,
            credibilityAdjusted: result.credibilityAdjusted,
            credibilityScore,
        });
    } catch (error) {
        console.error('Error in moderation API:', error);
        return NextResponse.json(
            {
                error: 'Moderation failed',
                isSafe: false,
                reason: 'Internal server error - content blocked for safety'
            },
            { status: 500 }
        );
    }
}
