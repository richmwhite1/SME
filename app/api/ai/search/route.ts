import { NextRequest, NextResponse } from 'next/server';
import { processNaturalLanguageQuery } from '@/lib/ai/intent-engine';

/**
 * POST /api/ai/search
 * Natural language search using Gemma intent extraction and synthesis
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query is required and must be a string' },
                { status: 400 }
            );
        }

        if (query.length < 3) {
            return NextResponse.json(
                { error: 'Query must be at least 3 characters long' },
                { status: 400 }
            );
        }

        // Process query through intent synthesis pipeline
        const response = await processNaturalLanguageQuery(query);

        return NextResponse.json({
            answer: response.answer,
            sources: response.sources,
            confidence: response.confidence,
        });
    } catch (error) {
        console.error('Error in search API:', error);
        return NextResponse.json(
            {
                error: 'Search failed',
                answer: "I'm having trouble processing your question right now. Please try again later.",
                sources: [],
                confidence: 'low'
            },
            { status: 500 }
        );
    }
}
