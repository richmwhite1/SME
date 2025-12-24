import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * API route to run the live-ledger-activity migration
 */
export async function GET() {
    const sql = getDb();
    const logs: string[] = [];

    try {
        logs.push('Starting live-ledger-activity migration...');

        // Read the SQL migration file
        const migrationPath = join(process.cwd(), 'migrations', 'live-ledger-activity.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // Execute the migration
        await sql.unsafe(migrationSQL);

        logs.push('✓ Created live_ledger_activity view successfully');

        // Test the view by fetching a few entries
        const testQuery = await sql`
      SELECT 
        activity_type,
        actor_name,
        target_name,
        detail,
        created_at
      FROM live_ledger_activity
      LIMIT 5
    `;

        logs.push(`✓ View is queryable. Found ${testQuery.length} activity entries.`);

        if (testQuery.length > 0) {
            logs.push('\nSample entries:');
            testQuery.forEach((entry, i) => {
                logs.push(`  ${i + 1}. [${entry.activity_type}] ${entry.actor_name} → ${entry.target_name}`);
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Live ledger activity view created successfully',
            logs,
            sampleData: testQuery
        });

    } catch (error: any) {
        logs.push(`✗ Error: ${error.message}`);
        console.error('Migration error:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            logs
        }, { status: 500 });
    }
}
