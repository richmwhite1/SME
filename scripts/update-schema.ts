
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDb, closeDb } from '../lib/db';

async function updateSchema() {
    console.log('Starting schema update...');
    const sql = getDb();

    try {
        // Add missing columns to products table
        await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS manufacturer TEXT,
      ADD COLUMN IF NOT EXISTS ingredients TEXT,
      ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS storage_instructions TEXT,
      ADD COLUMN IF NOT EXISTS serving_size TEXT,
      ADD COLUMN IF NOT EXISTS form TEXT,
      ADD COLUMN IF NOT EXISTS sme_review_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS avg_sme_purity NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_bioavailability NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_potency NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_evidence NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_sustainability NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_experience NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_safety NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_transparency NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS avg_sme_synergy NUMERIC(3,1);
    `;

        console.log('Successfully added columns to products table.');

    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        // Force close connection
        await closeDb();
        process.exit(0);
    }
}

updateSchema();
