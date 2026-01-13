import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getDb } from "../lib/db";
import fs from "fs";

async function runMigration() {
    const sql = getDb();
    const migrationPath = path.join(process.cwd(), "migrations", "fix_product_comments_full.sql");

    console.log(`Reading migration file from: ${migrationPath}`);
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    try {
        console.log("Running migration...");
        // Split by semicolon vs running all at once? postgres.js might support multi-statement.
        // simple() method is often used for multi-statement scripts in postgres.js if available, 
        // or just passing the string to sql``.

        await sql.unsafe(migrationSql);

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

runMigration();
