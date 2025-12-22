import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const sql = getDb();

  try {
    // Create topics table
    await sql`
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create topic_follows table
    await sql`
      CREATE TABLE IF NOT EXISTS topic_follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        topic_name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, topic_name)
      )
    `;

    // Create index on user_id for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_topic_follows_user_id 
      ON topic_follows(user_id)
    `;

    // Seed default topics
    const defaultTopics = [
      { name: 'Longevity', description: 'Science-backed strategies for extending healthspan and lifespan', icon: '⏳' },
      { name: 'Biohacking', description: 'Optimize your biology through technology and lifestyle interventions', icon: '🧬' },
      { name: 'Nutrition', description: 'Evidence-based nutrition science and dietary strategies', icon: '🥗' },
      { name: 'Fitness', description: 'Training protocols, exercise science, and performance optimization', icon: '💪' },
      { name: 'Mental Health', description: 'Cognitive enhancement, stress management, and psychological wellbeing', icon: '🧠' },
      { name: 'Sleep Optimization', description: 'Sleep science, circadian biology, and recovery protocols', icon: '😴' },
      { name: 'Supplements', description: 'Nutraceuticals, vitamins, and evidence-based supplementation', icon: '💊' },
      { name: 'Peptides', description: 'Therapeutic peptides and their applications in health optimization', icon: '🔬' },
      { name: 'Hormones', description: 'Hormone optimization, TRT, and endocrine health', icon: '⚡' },
      { name: 'Diagnostics', description: 'Lab testing, biomarkers, and health monitoring', icon: '📊' },
      { name: 'Nootropics', description: 'Cognitive enhancers and brain optimization compounds', icon: '🎯' },
      { name: 'Recovery', description: 'Recovery protocols, regenerative medicine, and healing optimization', icon: '🔄' },
    ];

    // Insert topics if they don't exist
    for (const topic of defaultTopics) {
      await sql`
        INSERT INTO topics (name, description, icon)
        VALUES (${topic.name}, ${topic.description}, ${topic.icon})
        ON CONFLICT (name) DO NOTHING
      `;
    }

    // Verify tables were created
    const topicsCount = await sql`SELECT COUNT(*) as count FROM topics`;
    const followsSchema = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topic_follows'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      success: true,
      message: 'Topics and topic_follows tables created successfully',
      topics_seeded: topicsCount[0].count,
      topic_follows_schema: followsSchema,
    });
  } catch (error: any) {
    console.error("Init topics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.code,
        hint: error.hint
      },
      { status: 500 }
    );
  }
}
