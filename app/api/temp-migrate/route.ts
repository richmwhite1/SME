import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const sql = getDb();

    try {
        await sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS citation_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sme_signals JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS admin_status TEXT DEFAULT 'pending_review';
      
      CREATE INDEX IF NOT EXISTS idx_products_admin_status ON products(admin_status);
    `;
        return NextResponse.json({ success: true, message: "Migration ran successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
