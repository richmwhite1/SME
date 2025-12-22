
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { getDb } from "./lib/db";

async function checkSchema() {
    const sql = getDb();
    console.log("Checking database schema...");

    try {
        // Check discussion_comments table
        const columns = await sql`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'discussion_comments'
    `;

        if (columns.length === 0) {
            console.log("Table 'discussion_comments' does NOT exist.");
        } else {
            console.log("Table 'discussion_comments' exists. Columns:");
            columns.forEach(col => {
                console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
            });
        }

        // Check discussions table
        const discColumns = await sql`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'discussions'
    `;

        if (discColumns.length === 0) {
            console.log("\nTable 'discussions' does NOT exist.");
        } else {
            console.log("\nTable 'discussions' exists. Columns:");
            discColumns.forEach(col => {
                console.log(`- ${col.column_name}: ${col.data_type}`);
            });
        }

        // Check comment_references table
        const refColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'comment_references'
    `;

        if (refColumns.length === 0) {
            console.log("\nTable 'comment_references' does NOT exist.");
        } else {
            console.log("\nTable 'comment_references' exists.");
        }

    } catch (error) {
        console.error("Error checking schema:", error);
    } finally {
        process.exit(0);
    }
}

checkSchema();
