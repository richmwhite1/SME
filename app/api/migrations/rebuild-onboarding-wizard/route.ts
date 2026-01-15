import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();

    try {
        // Step 1: Marketing & Core
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS tagline TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS company_blurb TEXT;`;

        // Step 2: Visuals & Media
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_photos TEXT[] DEFAULT '{}';`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_docs_url TEXT;`;

        // Step 3: SME Assessment Prep
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS target_audience TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS core_value_proposition TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sme_access_note TEXT;`;

        // Add comments for documentation
        await sql`COMMENT ON COLUMN products.tagline IS 'Quick product hook, max 100 characters (validated in app)';`;
        await sql`COMMENT ON COLUMN products.company_blurb IS 'Brand story and product mission for SME context';`;
        await sql`COMMENT ON COLUMN products.product_photos IS 'Array of image URLs for product photos';`;
        await sql`COMMENT ON COLUMN products.technical_docs_url IS 'Link to manuals, whitepapers, or API documentation';`;
        await sql`COMMENT ON COLUMN products.target_audience IS 'Target user demographic/persona';`;
        await sql`COMMENT ON COLUMN products.core_value_proposition IS 'Primary problem this product solves';`;
        await sql`COMMENT ON COLUMN products.technical_specs IS 'Key-value pairs for technical specifications';`;
        await sql`COMMENT ON COLUMN products.sme_access_note IS 'Instructions for expert reviewers';`;

        return NextResponse.json({ success: true, message: "Rebuild Onboarding Wizard migration applied successfully" });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
