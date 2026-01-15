import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();

    try {
        // Add category column
        await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS category TEXT;
    `;

        // Add brand column just in case
        await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS brand TEXT;
    `;

        // Ensure admin_status exists
        await sql`
       ALTER TABLE products
       ADD COLUMN IF NOT EXISTS admin_status TEXT DEFAULT 'pending_review';
    `;

        return NextResponse.json({ success: true, message: "Migration (Category/Brand) applied successfully" });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
