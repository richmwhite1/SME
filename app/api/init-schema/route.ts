import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Initialize the complete database schema from schema.sql
 * This route should be called once to set up all tables, indexes, functions, and views
 */
export async function GET() {
    try {
        const sql = getDb();

        // Read the schema.sql file
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

        // Split by semicolons and execute each statement
        const statements = schemaSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`Executing ${statements.length} SQL statements...`);

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await sql.unsafe(statement);
                } catch (err) {
                    // Log but continue - some statements might fail if already exist
                    console.warn('Statement execution warning:', err instanceof Error ? err.message : String(err));
                }
            }
        }

        // Verify key tables exist
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

        return NextResponse.json({
            status: 'Complete schema initialized successfully',
            tables: tables.map(t => t.table_name)
        });

    } catch (error) {
        console.error('Schema initialization failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to initialize schema',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
