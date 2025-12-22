require('dotenv').config({ path: '.env.local' });
const { getDb } = require('../lib/db');

async function checkSchema() {
    const sql = getDb();

    try {
        console.log('Checking reviews table...');
        const reviewsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
    `;
        console.table(reviewsColumns);

        console.log('\nChecking product_comments table...');
        const commentsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_comments'
    `;
        console.table(commentsColumns);

        console.log('\nChecking products table...');
        const productsColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `;
        console.table(productsColumns);

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        process.exit(0);
    }
}

checkSchema();
