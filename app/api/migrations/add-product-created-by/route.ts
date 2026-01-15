import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();

    try {
        // Add created_by column
        await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS created_by TEXT;
    `;

        return NextResponse.json({ success: true, message: "Migration (created_by) applied successfully" });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
