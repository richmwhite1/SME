import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Sync Profile API Route
 * Automatically creates a user profile if it doesn't exist
 * This prevents foreign key errors in topic_follows and other tables
 */
export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - No user found' },
                { status: 401 }
            );
        }

        const sql = getDb();

        // Check if profile exists
        const existingProfile = await sql`
      SELECT id
      FROM profiles
      WHERE id = ${user.id}
    `;

        if (existingProfile.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'Profile already exists',
                profileId: user.id,
            });
        }

        // Create profile if it doesn't exist
        const fullName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.emailAddresses[0]?.emailAddress || 'User';

        await sql`
      INSERT INTO profiles (id, email, full_name, avatar_url, contributor_score)
      VALUES (
        ${user.id},
        ${user.emailAddresses[0]?.emailAddress || ''},
        ${fullName},
        ${user.imageUrl || null},
        0
      )
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          avatar_url = EXCLUDED.avatar_url
    `;

        return NextResponse.json({
            success: true,
            message: 'Profile created successfully',
            profileId: user.id,
        });
    } catch (error) {
        console.error('Error syncing profile:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync profile',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
