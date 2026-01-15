
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateSMEScore } from '@/lib/sme-scoring';

export async function GET(request: Request) {
    // Simple security check (in production, use a secret header)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const sql = getDb();

    try {
        if (userId) {
            // Update specific user
            await calculateSMEScore(userId, true);
            return NextResponse.json({ success: true, message: `Updated score for user ${userId}` });
        } else {
            // Update all users (batching recommended for large scale)
            const users = await sql`SELECT id FROM profiles`;

            let updatedCount = 0;
            for (const user of users) {
                await calculateSMEScore(user.id, true);
                updatedCount++;
            }

            return NextResponse.json({ success: true, message: `Updated scores for ${updatedCount} users` });
        }
    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: 'Failed to update scores' }, { status: 500 });
    }
}
