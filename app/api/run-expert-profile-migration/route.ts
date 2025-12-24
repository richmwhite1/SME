import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * Run Expert Profile Wizard Migration
 * GET /api/run-expert-profile-migration
 */
export async function GET() {
    const sql = getDb();

    try {
        // Read and execute the migration file
        const migrationPath = join(process.cwd(), 'migrations', 'expert-profile-wizard.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // Execute the migration
        await sql.unsafe(migrationSQL);

        return NextResponse.json({
            success: true,
            message: 'Expert profile wizard migration completed successfully'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to run migration'
        }, { status: 500 });
    }
}
