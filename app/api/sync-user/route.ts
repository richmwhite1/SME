import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Profile Sync API Route
 * 
 * Checks if the currently logged-in Clerk user exists in the Railway profiles table.
 * If they don't exist, inserts them with a starting reputation score of 0.
 * 
 * Returns:
 * - { exists: true, profile: {...} } if user already exists
 * - { exists: false, profile: {...}, created: true } if user was just created
 */
export async function GET() {
    try {
        // Get the authenticated user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized - No user logged in' },
                { status: 401 }
            );
        }

        // Get full user details from Clerk
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const sql = getDb();

        // Check if user exists in profiles table
        const existingProfile = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;

        if (existingProfile.length > 0) {
            return NextResponse.json({
                exists: true,
                profile: existingProfile[0],
            });
        }

        // User doesn't exist, create new profile
        const newProfile = await sql`
      INSERT INTO profiles (
        id,
        full_name,
        email,
        avatar_url,
        contributor_score,
        badge_type,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${user.fullName || user.firstName || 'Anonymous'},
        ${user.emailAddresses[0]?.emailAddress || null},
        ${user.imageUrl || null},
        0,
        'Member',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

        return NextResponse.json({
            exists: false,
            created: true,
            profile: newProfile[0],
        });

    } catch (error) {
        console.error('Profile sync error:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync user profile',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
