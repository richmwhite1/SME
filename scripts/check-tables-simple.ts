
import postgres from 'postgres';

async function checkTables() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("Missing DATABASE_URL");
        process.exit(1);
    }

    const sql = postgres(databaseUrl);

    try {
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

        console.log("Tables found:", tables.map(t => t.table_name).sort());

        const requiredTables = ['discussions', 'discussion_comments', 'discussion_votes'];
        const missing = requiredTables.filter(rt => !tables.some(t => t.table_name === rt));

        if (missing.length > 0) {
            console.error("Missing required tables:", missing);
            process.exit(1);
        } else {
            console.log("All required discussion tables present.");
        }
    } catch (err) {
        console.error("Error checking tables:", err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

checkTables();
