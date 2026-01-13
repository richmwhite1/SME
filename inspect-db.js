const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function inspect() {
    console.log('Inspecting products table...');

    // Check if it's a table or view
    const tables = await sql`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_name = 'products'
  `;
    console.log('Table Info:', tables);

    // Check columns
    const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'products'
    ORDER BY column_name
  `;
    console.log('Columns:', columns.map(c => c.column_name));

    await sql.end();
}

inspect().catch(console.error);
