import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
    try {
        const sql = getDb();

        // Execute migration steps sequentially

        // 1. Create table
        await sql.unsafe(`
          CREATE TABLE IF NOT EXISTS community_milestones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            milestone_type TEXT NOT NULL CHECK (milestone_type IN ('verified_audits', 'community_size', 'trusted_voices', 'evidence_sources')),
            target_value INTEGER NOT NULL,
            achieved_value INTEGER NOT NULL,
            achieved_at TIMESTAMPTZ DEFAULT NOW(),
            is_displayed BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'::jsonb
          );
        `);

        // 2. Ensure columns exist (for schema evolution)
        await sql.unsafe(`ALTER TABLE community_milestones ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`);
        await sql.unsafe(`ALTER TABLE community_milestones ADD COLUMN IF NOT EXISTS milestone_type TEXT;`);

        // 3. Create indexes
        await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_milestones_is_displayed ON community_milestones(is_displayed) WHERE is_displayed = true;`);
        await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_milestones_achieved_at ON community_milestones(achieved_at DESC);`);
        await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_milestones_type ON community_milestones(milestone_type);`);

        // 3. Disable RLS
        await sql.unsafe(`ALTER TABLE community_milestones DISABLE ROW LEVEL SECURITY;`);

        // 4. Add comments
        await sql.unsafe(`COMMENT ON TABLE community_milestones IS 'Community achievement milestones for celebrating collective progress';`);
        await sql.unsafe(`COMMENT ON COLUMN community_milestones.title IS 'Short title for the milestone (e.g., "500 Verified Audits")';`);
        await sql.unsafe(`COMMENT ON COLUMN community_milestones.description IS 'Full description message displayed to users';`);
        await sql.unsafe(`COMMENT ON COLUMN community_milestones.milestone_type IS 'Type of milestone: verified_audits, community_size, trusted_voices, evidence_sources';`);
        await sql.unsafe(`COMMENT ON COLUMN community_milestones.is_displayed IS 'Whether this milestone should be shown to all users';`);
        await sql.unsafe(`COMMENT ON COLUMN community_milestones.metadata IS 'Additional JSON data for milestone context';`);

        return NextResponse.json({
            success: true,
            version: "v2-fix-metadata",
            message: "Successfully created community_milestones table and indexes.",
        });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
