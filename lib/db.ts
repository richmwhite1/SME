import postgres from 'postgres';

// Single connection pool for Railway Postgres
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

  // Create connection with optimal settings for serverless deployment
  sql = postgres(databaseUrl, {
    max: 10, // Connection pool size
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false, // SSL in production
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