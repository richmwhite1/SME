
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkColumns() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, {
        ssl: 'require',
        max: 1
    });

    try {
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY column_name;
    `;

        console.log('Columns in profiles table:');
        console.table(columns);

    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        await sql.end();
    }
}

checkColumns();
