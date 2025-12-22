
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function testConnection() {
    console.log("Testing connection...");

    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("Error: DATABASE_URL is missing from .env.local");
        process.exit(1);
    }

    console.log("Original DATABASE_URL length:", databaseUrl.length);

    // Fix known issue: duplicate prefix
    if (databaseUrl.includes("DATABASE_URL=")) {
        console.log("Fixing malformed URL (removing prefix)...");
        databaseUrl = databaseUrl.split("DATABASE_URL=").pop();
    }

    // Fix known issue: surrounding quotes
    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

    // Mask password for logging
    try {
        const url = new URL(databaseUrl);
        console.log(`Connecting to: ${url.protocol}//${url.username}:****@${url.hostname}:${url.port}${url.pathname}`);
    } catch (e) {
        console.error("Could not parse URL for logging:", e.message);
    }

    const sql = postgres(databaseUrl, {
        ssl: 'require',
        connect_timeout: 10,
        max: 1
    });

    try {
        const result = await sql`SELECT 1 as connected`;
        console.log("Connection SUCCESS!", result);

        console.log("Attempting schema creation...");

        // User Profiles for Reputation
        await sql`
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            score INTEGER DEFAULT 0,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `;
        console.log("Checked/Created profiles table");

        // Community Products
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
        console.log("Checked/Created products table");


        // Signals/Notifications
        await sql`
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            target_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `;
        console.log("Checked/Created notifications table");


        // Discussions & Comments
        await sql`
        CREATE TABLE IF NOT EXISTS discussions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            author_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `;
        console.log("Checked/Created discussions table");


        await sql`
        CREATE TABLE IF NOT EXISTS comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            discussion_id UUID REFERENCES discussions(id),
            author_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `;
        console.log("Checked/Created comments table");

        console.log("ALL OPERATIONS SUCCESSFUL");

    } catch (err) {
        console.error("Connection FAILED:", err);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

testConnection();
