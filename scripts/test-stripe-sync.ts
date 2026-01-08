
import { getDb } from "../lib/db";

async function main() {
    const sql = getDb();

    console.log("🔍 Checking for unsynced product views...");

    // 1. Check current unsynced count
    const unsynced = await sql`
    SELECT COUNT(*) as count, SUM(view_count) as total_views
    FROM product_view_metrics
    WHERE synced_to_stripe = false
  `;

    console.log(`📊 Unsynced records: ${unsynced[0].count}`);
    console.log(`👀 Total pending views: ${unsynced[0].total_views || 0}`);

    if (unsynced[0].count > 0) {
        console.log("\n🧪 To test the sync (DRY RUN):");
        console.log("curl 'http://localhost:3000/api/cron/sync-usage?dryRun=true'");

        console.log("\n🚀 To execute the sync:");
        console.log("curl 'http://localhost:3000/api/cron/sync-usage'");
    } else {
        console.log("\n✅ All views are currently synced!");
        console.log("To test, visit a verified product page first.");
    }
}

main().catch(console.error);
