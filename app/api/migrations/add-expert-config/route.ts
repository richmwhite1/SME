import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();

    try {
        await sql.begin(async (sql) => {
            // Add insight_trigger_upvote_threshold
            await sql`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS insight_trigger_upvote_threshold INTEGER DEFAULT 5;
      `;

            // Add insight_trigger_reputation_tier
            await sql`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS insight_trigger_reputation_tier INTEGER DEFAULT 1;
      `;

            // Ensure insight_summary exists (it likely does, but good to ensure)
            await sql`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS insight_summary TEXT;
      `;
        });

        return NextResponse.json({ success: true, message: "Migration applied successfully" });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
