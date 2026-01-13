import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getDb } from "../lib/db";

async function verifySchema() {
    const sql = getDb();

    try {
        console.log("Checking product_comments table structure...\n");

        const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_comments'
      ORDER BY ordinal_position
    `;

        console.log("✅ product_comments table exists with the following columns:\n");
        columns.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        console.log("\n✅ Schema verification complete!");

    } catch (error) {
        console.error("❌ Schema verification failed:", error);
    } finally {
        process.exit();
    }
}

verifySchema();
