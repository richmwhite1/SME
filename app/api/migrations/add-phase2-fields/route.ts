import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sql = getDb();

        await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS servings_per_container TEXT,
      ADD COLUMN IF NOT EXISTS best_time_take TEXT,
      ADD COLUMN IF NOT EXISTS storage_instructions TEXT,
      ADD COLUMN IF NOT EXISTS warnings TEXT,
      ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS active_ingredients JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS sme_access_note TEXT,
      ADD COLUMN IF NOT EXISTS sme_signals JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS is_brand_owner BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS brand_owner_id TEXT
    `;

        return NextResponse.json({
            success: true,
            message: 'Successfully added ALL Phase 2 columns to products table'
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
