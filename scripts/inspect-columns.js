
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
    const sql = postgres(process.env.DATABASE_URL);

    try {
        const tables = ['discussions', 'discussion_comments', 'product_comments', 'reviews'];

        for (const table of tables) {
            const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `;
            console.log(`\nTable: ${table}`);
            console.log(columns.map(c => c.column_name).join(', '));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

inspect();
