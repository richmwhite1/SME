
import postgres from 'postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("Missing DATABASE_URL");
    }

    // Fix for malformed DATABASE_URL (self-contained logic)
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
      // User Profiles (Synced with Clerk)
      await sql`
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY, -- Clerk ID
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            username TEXT,
            bio TEXT,
            website_url TEXT,
            credentials TEXT,
            contributor_score INTEGER DEFAULT 0,
            is_verified_expert BOOLEAN DEFAULT FALSE,
            is_admin BOOLEAN DEFAULT FALSE,
            badge_type TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Community Products (formerly protocols)
      await sql`
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            slug TEXT UNIQUE,
            problem_solved TEXT,
            ai_summary TEXT,
            buy_url TEXT,
            reference_url TEXT,
            images TEXT[],
            is_sme_certified BOOLEAN DEFAULT FALSE,
            third_party_lab_verified BOOLEAN DEFAULT FALSE,
            purity_tested BOOLEAN DEFAULT FALSE,
            source_transparency BOOLEAN DEFAULT FALSE,
            potency_verified BOOLEAN DEFAULT FALSE,
            excipient_audit BOOLEAN DEFAULT FALSE,
            operational_legitimacy BOOLEAN DEFAULT FALSE,
            tags TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Reviews / Verification
      await sql`
        CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES products(id),
            user_id TEXT REFERENCES profiles(id),
            rating INTEGER,
            content TEXT,
            is_flagged BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Signals/Notifications
      await sql`
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL, -- No foreign key to allow system notifications
            message TEXT NOT NULL,
            type TEXT, -- 'reply', 'mention', 'system'
            link TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Discussions
      await sql`
        CREATE TABLE IF NOT EXISTS discussions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            slug TEXT UNIQUE,
            content TEXT,
            author_id TEXT REFERENCES profiles(id),
            tags TEXT[],
            is_flagged BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Discussion Comments
      await sql`
        CREATE TABLE IF NOT EXISTS discussion_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            discussion_id UUID REFERENCES discussions(id),
            author_id TEXT REFERENCES profiles(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Topic Follows
      await sql`
        CREATE TABLE IF NOT EXISTS topic_follows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT REFERENCES profiles(id),
            topic_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, topic_name)
        );
      `;

      return NextResponse.json({ status: "Database Initialized" });
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
