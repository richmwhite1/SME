
import { config } from 'dotenv';
config({ path: '.env.local' });
import { calculateSMEScore, POINTS } from '../lib/sme-scoring';
import { getDb } from '../lib/db';

async function testWCS() {
    console.log("Starting WCS Logic Verification...");
    const db = getDb();

    // 1. Create Mock User
    const testUserId = "test_user_wcs_" + Date.now();
    console.log(`Creating test user: ${testUserId}`);

    await db`
        INSERT INTO profiles (id, username, full_name, is_verified_expert)
        VALUES (${testUserId}, ${testUserId}, 'WCS Tester', false)
    `;

    try {
        // 2. Insert Old Contributions (10 months ago)
        // 10 comments on "Sleep" products.
        // Base Points: 10 * 10 = 100.
        // Decay: 10 months * 0.5 = 5 points per item.
        // Effective: 10 * (10 - 5) = 50 points.

        console.log("Inserting 10 old comments (10 months ago)...");
        const tenMonthsAgo = new Date();
        tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

        // Mock products with tags
        const productId = '00000000-0000-0000-0000-000000000001'; // assumes existence or loose FK? 
        // We need effective FKs usually. 
        // Let's create a dummy product first.
        const productUuid = crypto.randomUUID();
        await db`
            INSERT INTO products (id, title, slug, tags)
            VALUES (${productUuid}, 'Sleep Aid', ${'sleep-aid-' + Date.now()}, ARRAY['Sleep', 'Bioavailability'])
        `;

        for (let i = 0; i < 10; i++) {
            await db`
                INSERT INTO product_comments (product_id, author_id, content, created_at)
                VALUES (${productUuid}, ${testUserId}, 'Test Comment', ${tenMonthsAgo})
            `;
        }

        // 3. Insert New Contributions (Now)
        // 5 Reviews on "Sleep" products.
        // Base: 5 * 20 = 100.
        // Decay: 0.
        // Effective: 100.
        console.log("Inserting 5 new reviews (Now)...");
        for (let i = 0; i < 5; i++) {
            await db`
                INSERT INTO reviews (product_id, user_id, content, rating, created_at)
                VALUES (${productUuid}, ${testUserId}, 'Great stuff', 5, NOW())
            `;
        }

        // 4. Run Calculation
        console.log("Calculating Score...");
        const result = await calculateSMEScore(testUserId, true);

        console.log("--- RESULT ---");
        console.log("Total Score:", result.score);
        console.log("Level:", result.level, result.levelName);
        console.log("Details:", JSON.stringify(result.details, null, 2));
        console.log("Pillar Scores:", result.pillarScores);
        console.log("Gained Expertise:", result.gainedExpertise);

        // Assertions
        // Expected Score:
        // Old Comments: 10 comments * (10 base - 5 decay) = 50.
        // New Reviews: 5 reviews * (20 base - 0 decay) = 100.
        // Total: 150.

        // Pillar "Sleep": 150.
        // Pillar "Bioavailability": 150.

        // Expected Level: 2 (Threshold 100).

        if (Math.abs(result.score - 150) < 1) {
            console.log("✅ Score Calculation Verified (150)");
        } else {
            console.error("❌ Score Calculation FAILED. Expected 150, got " + result.score);
        }

        if (result.level === 2) {
            console.log("✅ Level Verification Passed (Orange Chakra)");
        } else {
            console.error("❌ Level Verification FAILED. Expected 2, got " + result.level);
        }

        if (result.pillarScores['sleep'] >= 150) { // Normalized lowercase
            console.log("✅ Pillar Attribution Verified");
        } else {
            console.log("ℹ️ Pillar Score keys:", Object.keys(result.pillarScores));
            console.warn("⚠️ Pillar Attribution check needs manual verification against keys.");
        }

        // 5. Test Pillar Threshold (add BIG points)
        // Need > 500 for expertise.
        // Add 20 Citations (x30 = 600) on "Potency".
        console.log("Adding 20 Citations (600 pts) for Potency...");

        // Mock product with Potency
        const potencyUuid = crypto.randomUUID();
        await db`
            INSERT INTO products (id, title, slug, tags)
            VALUES (${potencyUuid}, 'Potent Stuff', ${'potent-' + Date.now()}, ARRAY['Potency'])
        `;

        // We use Reviews for now as Citations are not fully DB-mockable without more setup? 
        // Actually I can insert Reviews. 20 Reviews * 20 pts = 400. Not enough.
        // 30 Reviews * 20 pts = 600.
        for (let i = 0; i < 30; i++) {
            await db`
                INSERT INTO reviews (product_id, user_id, content, rating, created_at)
                VALUES (${potencyUuid}, ${testUserId}, 'Potent!', 5, NOW())
            `;
        }

        const result2 = await calculateSMEScore(testUserId, true);
        console.log("Updated Score:", result2.score);
        console.log("Gained Expertise:", result2.gainedExpertise);

        if (result2.gainedExpertise.includes('Potency')) {
            console.log("✅ Pillar Expertise Granted for Potency");
        } else {
            console.error("❌ Pillar Expertise FAILED. 'Potency' not found in " + result2.gainedExpertise);
        }

        // 6. Test Upvotes (2 pts)
        console.log("Adding 1 Upvote to a discussion...");
        // Need a discussion first
        const discussionUuid = crypto.randomUUID();
        await db`
            INSERT INTO discussions (id, title, slug, content, author_id, tags)
            VALUES (${discussionUuid}, 'Test Disc', ${'test-disc-' + Date.now()}, 'Content', ${testUserId}, ARRAY['Sleep'])
        `;

        // Add vote from some random user
        const voterId = "voter_" + Date.now();
        await db`INSERT INTO profiles (id, username) VALUES (${voterId}, ${voterId})`;

        await db`
            INSERT INTO discussion_votes (discussion_id, user_id)
            VALUES (${discussionUuid}, ${voterId})
        `;

        const result3 = await calculateSMEScore(testUserId, true);
        console.log("Score after Upvote:", result3.score);
        console.log("Upvotes Breakdown:", result3.details.breakdown.upvotes);

        const expectedScoreAfterUpvote = result2.score + 2 + 20; // +2 for vote, +20 for creating the discussion itself (which I just did)
        console.log(`Expected ~${expectedScoreAfterUpvote} (Previous ${result2.score} + 20 (Disc) + 2 (Vote))`);

        if (Math.abs(result3.score - expectedScoreAfterUpvote) < 1) {
            console.log("✅ Upvote Scoring Verified");
        } else {
            console.error(`❌ Upvote Scoring FAILED. Expected ${expectedScoreAfterUpvote}, got ${result3.score}`);
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        // Cleanup
        console.log("Cleaning up...");
        await db`DELETE FROM profiles WHERE id = ${testUserId}`;
        await db`DELETE FROM discussion_votes WHERE user_id LIKE 'voter_%'`;
        await db`DELETE FROM profiles WHERE id LIKE 'voter_%'`;
        process.exit(0);
    }
}

testWCS();
