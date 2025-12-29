import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        console.log("🚀 Starting brand management schema migration...");

        // Read migration file
        const migrationPath = path.join(process.cwd(), "migrations", "brand-management-schema.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

        console.log("✓ Migration file loaded");

        // Get database connection
        const sql = getDb();

        console.log("✓ Database connected");
        console.log("📊 Executing migration...");

        // Execute the entire migration as one transaction
        await sql.unsafe(migrationSQL);

        console.log("✅ Migration completed successfully!");

        // Verify tables were created
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('brand_verifications', 'sme_certifications', 'product_view_metrics', 'stripe_subscriptions')
      ORDER BY table_name
    `;

        return NextResponse.json({
            success: true,
            message: "Brand management schema migration completed successfully",
            tablesCreated: tables.map((t) => t.table_name),
        });
    } catch (error: any) {
        console.error("❌ Migration failed:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
                details: error.toString(),
            },
            { status: 500 }
        );
    }
}
