import postgres from 'postgres';

// Railway Postgres connection using DATABASE_URL
let sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  // Return existing connection if already created
  if (sql) {
    return sql;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Please configure your Railway Postgres connection string."
    );
  }

  // Create connection with optimal settings for serverless
  sql = postgres(databaseUrl, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return sql;
}

// Helper function to safely close the connection (useful for cleanup)
export async function closeDb() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}
