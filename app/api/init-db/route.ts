
import postgres from 'postgres';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("Missing DATABASE_URL");
    }

    // Fix for malformed DATABASE_URL
    if (databaseUrl.includes("DATABASE_URL=")) {
      databaseUrl = databaseUrl.split("DATABASE_URL=").pop() || databaseUrl;
    }
    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

    // Create a fresh connection
    const sql = postgres(databaseUrl, {
      ssl: 'require',
      max: 1 // Optimization for single-use script
    });

    try {
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      console.log(`Reading schema from: ${schemaPath}`);

      if (!fs.existsSync(schemaPath)) {
        throw new Error(`schema.sql not found at ${schemaPath}`);
      }

      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      // Execute the schema using unsafe for raw SQL
      // splitting by statement might be needed if the driver doesn't support multiple statements in one go,
      // but postgres.js usually handles it via simple call or we can try.
      // However, usually it's safer to use the file method if available, or just pass the string.
      // basic pg driver allows multiple statements. postgres.js documentation says:
      // "You can execute multiple statements by separating them with semicolons."

      await sql.unsafe(schemaContent);

      return NextResponse.json({ status: "Database Initialized with schema.sql" });
    } finally {
      await sql.end();
    }

  } catch (error) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      { error: "Failed to initialize database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
