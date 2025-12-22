
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { getDb } from "./lib/db";
import fs from "fs";
import path from "path";

async function applyFix() {
    const sql = getDb();
    console.log("Applying database fix...");

    try {
        const sqlFile = path.join(process.cwd(), "postgres-fix-comments-complete.sql");
        const sqlContent = fs.readFileSync(sqlFile, "utf8");

        // Split by semicolons to execute statements individually, or just executed as one block if postgres driver supports it.
        // The postgres driver often supports multiple statements, but sometimes it's safer to not depend on it implicitly unless configured.
        // However, postgres.js usually handles simple query strings well.
        // Let's try executing the whole string.

        await sql.file(sqlFile);

        console.log("Migration applied successfully!");
    } catch (error) {
        console.error("Error applying migration:", error);
    } finally {
        process.exit(0);
    }
}

applyFix();
