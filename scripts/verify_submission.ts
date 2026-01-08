
import dotenv from 'dotenv';
import path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { getDb, closeDb } from '../lib/db';

async function verifyProduct() {
    const sql = getDb();
    try {
        const products = await sql`
      SELECT 
        id, 
        name, 
        created_at, 
        admin_status,
        is_verified,
        is_sme_certified,
        brand_owner_id,
        truth_evidence,
        truth_evidence_urls,
        technical_specs,
        active_ingredients,
        core_value_proposition
      FROM products 
      WHERE name = 'Browser Test Product' 
         OR name = 'Browser Test Product 2024'
         OR name = 'Browser Test Product V3'
         OR name = 'Browser Test Product V4'
         OR name = 'Browser Test Product V5'
         OR name = 'Browser Test Product V6'
         OR name = 'Browser Test Product V7'
         OR name = 'Browser Test Product V8'
      ORDER BY created_at DESC
    `;

        console.log('Found products:', JSON.stringify(products, null, 2));

        if (products.length > 0) {
            console.log('SUCCESS: Product found in database.');
        } else {
            console.log('FAILURE: Product not found.');
        }

    } catch (error) {
        console.error('Error querying products:', error);
    } finally {
        await closeDb();
    }
}

verifyProduct();
