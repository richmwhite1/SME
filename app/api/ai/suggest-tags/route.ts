import { NextRequest, NextResponse } from 'next/server';
import { suggestTags } from '@/lib/ai/auto-tagger';
import { getDb } from '@/lib/db/server';

/**
 * POST /api/ai/suggest-tags
 * Suggest tags for content using Gemma and credibility weighting
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, type, userId } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Content is required and must be a string' },
                { status: 400 }
            );
        }

        if (!type || !['product', 'discussion'].includes(type)) {
            return NextResponse.json(
                { error: 'Type must be either "product" or "discussion"' },
                { status: 400 }
            );
        }

        // Get author credibility if userId provided
        let authorCredibility;
        if (userId) {
            const db = getDb();
            const [profile] = await db`
        SELECT 
          COALESCE(is_sme, is_verified_expert, false) as is_sme,
          reputation_score
        FROM profiles
        WHERE id = ${userId}
      `;

            if (profile) {
                authorCredibility = {
                    isSme: profile.is_sme,
                    reputationScore: profile.reputation_score || 0,
                };
            }
        }

        // Get tag suggestions
        const suggestions = await suggestTags(content, type, authorCredibility);

        return NextResponse.json({
            suggestions,
        });
    } catch (error) {
        console.error('Error in tag suggestion API:', error);
        return NextResponse.json(
            {
                error: 'Tag suggestion failed',
                suggestions: []
            },
            { status: 500 }
        );
    }
}
