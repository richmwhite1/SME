#!/usr/bin/env node

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    max: 1,
});

async function checkTurmericProducts() {
    try {
        const products = await sql`
      SELECT id, title, slug, problem_solved
      FROM products
      WHERE title ILIKE '%turmeric%' OR slug ILIKE '%turmeric%'
    `;

        console.log(`Found ${products.length} products matching 'turmeric':`);
        console.log(JSON.stringify(products, null, 2));

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTurmericProducts();
