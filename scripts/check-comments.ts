import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getDb } from "../lib/db";

async function checkComments() {
    const sql = getDb();

    try {
        console.log("Checking recent product comments with metadata...\n");

        const comments = await sql`
      SELECT 
        id, 
        content, 
        metadata,
        created_at
      FROM product_comments
      ORDER BY created_at DESC
      LIMIT 5
    `;

        console.log(`Found ${comments.length} recent comments:\n`);

        comments.forEach((comment, idx) => {
            console.log(`Comment ${idx + 1}:`);
            console.log(`  ID: ${comment.id}`);
            console.log(`  Content: ${comment.content.substring(0, 50)}...`);
            console.log(`  Metadata: ${JSON.stringify(comment.metadata, null, 2)}`);
            console.log(`  Created: ${comment.created_at}`);
            console.log('---');
        });

        // Check for any comments with x_post_url
        const xComments = await sql`
      SELECT 
        id, 
        content, 
        metadata,
        created_at
      FROM product_comments
      WHERE metadata IS NOT NULL
      AND metadata::text LIKE '%x_post_url%'
      ORDER BY created_at DESC
      LIMIT 5
    `;

        console.log(`\nFound ${xComments.length} comments with X post URLs:\n`);

        xComments.forEach((comment, idx) => {
            console.log(`X Comment ${idx + 1}:`);
            console.log(`  ID: ${comment.id}`);
            console.log(`  X URL: ${comment.metadata?.x_post_url}`);
            console.log('---');
        });

    } catch (error) {
        console.error("❌ Check failed:", error);
    } finally {
        process.exit();
    }
}

checkComments();
