
import postgres from 'postgres';

async function checkView() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("Missing DATABASE_URL");
        process.exit(1);
    }

    const sql = postgres(databaseUrl);

    try {
        const result = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name = 'admin_approval_queue'
    `;

        console.log("admin_approval_queue type:", result);
    } catch (err) {
        console.error("Error checking view:", err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

checkView();
