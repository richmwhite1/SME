
const postgres = require('postgres');

async function initDb() {
    console.log("Initializing database via Node script...");

    // railway run injects DATABASE_URL
    let databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        // Fallback for local testing if not running via railway run
        try {
            require('dotenv').config({ path: '.env.local' });
            databaseUrl = process.env.DATABASE_URL;
        } catch (e) {
            // ignore
        }
    }

    if (!databaseUrl) {
        console.error("Error: DATABASE_URL is missing. Make sure to run with 'railway run node init-db.js'");
        process.exit(1);
    }

    // Cleanup URL if needed
    if (databaseUrl.includes("DATABASE_URL=")) {
        databaseUrl = databaseUrl.split("DATABASE_URL=").pop();
    }
    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

    const sql = postgres(databaseUrl, {
        ssl: 'require',
        connect_timeout: 20,
        max: 1
    });

    try {
        console.log("Connecting...");

        // Test query
        await sql`SELECT 1`;
        console.log("Connected successfully.");

        // Create Tables
        console.log("Creating tables...");

        await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        score INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("- profiles: OK");

        await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("- products: OK");

        await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        target_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("- notifications: OK");

        await sql`
      CREATE TABLE IF NOT EXISTS discussions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        author_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("- discussions: OK");

        await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discussion_id UUID REFERENCES discussions(id),
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("- comments: OK");

        console.log("Database initialized successfully! 🎉");

    } catch (err) {
        console.error("Initialization Failed:", err);
        if (err.code === 'CONNECT_TIMEOUT') {
            console.error("\nNOTE: Connection timed out. This likely means your network/firewall is blocking port 5432.");
        }
    } finally {
        await sql.end();
    }
}

initDb();
