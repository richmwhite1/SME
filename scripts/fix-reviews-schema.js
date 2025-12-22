require('dotenv').config({ path: '.env.local' });
const { getDb } = require('../lib/db');

async function fixSchema() {
    const sql = getDb();

    try {
        console.log('Adding missing columns to reviews table...');
        await sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
    `;
        await sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
    `;
        console.log('✅ Columns added successfully');

    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
