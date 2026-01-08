import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Check if user is admin
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            return NextResponse.json(
                { error: 'Only administrators can run migrations' },
                { status: 403 }
            );
        }

        const sql = getDb();

        // Step 1: Add user_role column
        await sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'standard' 
      CHECK (user_role IN ('standard', 'sme', 'sme_admin', 'admin', 'business_user'))
    `;

        // Step 2: Migrate existing permissions to roles
        await sql`
      UPDATE profiles
      SET user_role = CASE
        WHEN is_admin = true THEN 'admin'
        WHEN is_verified_expert = true THEN 'sme_admin'
        WHEN is_sme = true THEN 'sme'
        ELSE 'standard'
      END
      WHERE user_role = 'standard'
    `;

        // Step 3: Create index
        await sql`
      CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role)
    `;

        // Step 4: Get migration results
        const results = await sql`
      SELECT 
        user_role,
        COUNT(*) as user_count
      FROM profiles
      GROUP BY user_role
      ORDER BY 
        CASE user_role
          WHEN 'admin' THEN 1
          WHEN 'sme_admin' THEN 2
          WHEN 'sme' THEN 3
          WHEN 'business_user' THEN 4
          WHEN 'standard' THEN 5
        END
    `;

        return NextResponse.json({
            success: true,
            message: 'User role migration completed successfully',
            results: results
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: 'Failed to run migration', details: String(error) },
            { status: 500 }
        );
    }
}
