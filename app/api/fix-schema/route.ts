import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Fix database schema issues
 */
export async function GET() {
    try {
        const sql = getDb();
        const fixes = [];

        // Check profiles table structure
        const profilesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position
    `;

        fixes.push({ table: 'profiles', columns: profilesColumns });

        // Fix 1: Add id column to profiles if it doesn't exist (it should be user_id as TEXT)
        const hasIdColumn = profilesColumns.some((col: any) => col.column_name === 'id');

        if (!hasIdColumn) {
            // Check if user_id exists
            const hasUserId = profilesColumns.some((col: any) => col.column_name === 'user_id');

            if (hasUserId) {
                // Add id as an alias/copy of user_id
                await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id TEXT`;
                await sql`UPDATE profiles SET id = user_id WHERE id IS NULL`;
                fixes.push({ fix: 'Added id column to profiles table' });
            } else {
                fixes.push({ error: 'profiles table has neither id nor user_id column' });
            }
        }

        // Fix 2: Add created_by column to protocols if it doesn't exist
        const protocolsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'protocols'
      ORDER BY ordinal_position
    `;

        const hasCreatedBy = protocolsColumns.some((col: any) => col.column_name === 'created_by');

        if (!hasCreatedBy) {
            await sql`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS created_by TEXT`;
            fixes.push({ fix: 'Added created_by column to protocols table' });
        }

        // Fix 3: Ensure discussions table has proper structure
        await sql`
      CREATE TABLE IF NOT EXISTS discussions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        tags TEXT[],
        is_flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
        fixes.push({ fix: 'Ensured discussions table exists' });

        return NextResponse.json({
            success: true,
            fixes,
            message: 'Schema fixes applied'
        });

    } catch (error) {
        console.error('Schema fix failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to fix schema',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
