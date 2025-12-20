import postgres from 'postgres';

// Client-side database connection for Railway Postgres
// Note: In Next.js, client components should call server actions instead of direct DB access
// This file is provided for edge cases where direct client DB access is needed

let sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  // Return existing connection if already created
  if (sql) {
    return sql;
  }

  const databaseUrl = process.env.NEXT_PUBLIC_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_DATABASE_URL environment variable. For security, client-side DB access should be minimal. Consider using server actions instead."
    );
  }

  // Create connection
  sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return sql;
}

// Helper function to safely close the connection
export async function closeDb() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}
