
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, {
        ssl: 'require',
        max: 1
    });

    try {
        const users = await sql`
      SELECT id, full_name, username, created_at, is_sme, is_banned
      FROM profiles
      ORDER BY created_at DESC
      LIMIT 20
    `;

        const count = await sql`SELECT COUNT(*) FROM profiles`;

        console.log(`Total users: ${count[0].count}`);
        console.log('Recent 20 users:');
        console.table(users);

    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await sql.end();
    }
}

checkUsers();
