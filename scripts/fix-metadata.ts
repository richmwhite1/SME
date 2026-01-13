import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getDb } from "../lib/db";

async function fixMetadata() {
    const sql = getDb();

    try {
        console.log("Finding comments with stringified metadata...\n");

        // Find comments where metadata is a string (double-stringified)
        const comments = await sql`
      SELECT id, metadata
      FROM product_comments
      WHERE metadata IS NOT NULL
      AND metadata::text LIKE '"{%'
    `;

        console.log(`Found ${comments.length} comments to fix\n`);

        for (const comment of comments) {
            try {
                // Parse the double-stringified JSON
                const metadataString = comment.metadata as any;
                const parsed = typeof metadataString === 'string'
                    ? JSON.parse(metadataString)
                    : metadataString;

                console.log(`Fixing comment ${comment.id}:`);
                console.log(`  Before: ${JSON.stringify(comment.metadata)}`);
                console.log(`  After: ${JSON.stringify(parsed)}`);

                // Update with properly parsed object
                await sql`
          UPDATE product_comments
          SET metadata = ${parsed}
          WHERE id = ${comment.id}
        `;

                console.log(`  ✅ Fixed\n`);
            } catch (err) {
                console.error(`  ❌ Error fixing comment ${comment.id}:`, err);
            }
        }

        // Also fix discussion_comments
        const discussionComments = await sql`
      SELECT id, metadata
      FROM discussion_comments
      WHERE metadata IS NOT NULL
      AND metadata::text LIKE '"{%'
    `;

        console.log(`\nFound ${discussionComments.length} discussion comments to fix\n`);

        for (const comment of discussionComments) {
            try {
                const metadataString = comment.metadata as any;
                const parsed = typeof metadataString === 'string'
                    ? JSON.parse(metadataString)
                    : metadataString;

                console.log(`Fixing discussion comment ${comment.id}:`);
                console.log(`  Before: ${JSON.stringify(comment.metadata)}`);
                console.log(`  After: ${JSON.stringify(parsed)}`);

                await sql`
          UPDATE discussion_comments
          SET metadata = ${parsed}
          WHERE id = ${comment.id}
        `;

                console.log(`  ✅ Fixed\n`);
            } catch (err) {
                console.error(`  ❌ Error fixing comment ${comment.id}:`, err);
            }
        }

        console.log("\n✅ Metadata fix complete!");

    } catch (error) {
        console.error("❌ Fix failed:", error);
    } finally {
        process.exit();
    }
}

fixMetadata();
