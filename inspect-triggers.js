const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function inspect() {
    console.log('Inspecting triggers on products table...');

    const triggers = await sql`
    SELECT trigger_name, event_manipulation, action_statement, action_orientation
    FROM information_schema.triggers
    WHERE event_object_table = 'products'
  `;
    console.log('Triggers:', triggers);

    await sql.end();
}

inspect().catch(console.error);
