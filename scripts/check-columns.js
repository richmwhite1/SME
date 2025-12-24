#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkColumns() {
    const sql = postgres(process.env.DATABASE_URL);

    try {
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('video_url', 'youtube_link', 'technical_docs_url', 'tech_docs', 'target_audience', 'core_value_proposition', 'sme_access_note', 'tagline', 'company_blurb', 'product_photos')
      ORDER BY column_name;
    `;

        console.log('Existing columns in products table:');
        columns.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sql.end();
    }
}

checkColumns();
