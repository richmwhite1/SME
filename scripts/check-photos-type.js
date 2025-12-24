#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkColumnType() {
    const sql = postgres(process.env.DATABASE_URL);

    try {
        const result = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'product_photos';
    `;

        console.log('product_photos column details:');
        console.log(result);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sql.end();
    }
}

checkColumnType();
