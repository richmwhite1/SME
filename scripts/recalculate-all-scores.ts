/**
 * Recalculate SME scores for all users
 * Run this script to update all user Chakra levels based on their contributions
 */

import { getDb } from '../lib/db.js';
import { calculateSMEScore } from '../lib/sme-scoring.js';

async function recalculateAllScores() {
    const sql = getDb();

    console.log('Fetching all users...');
    const users = await sql`
        SELECT id, username, full_name
        FROM profiles
        ORDER BY id
    `;

    console.log(`Found ${users.length} users. Starting score recalculation...`);

    let updated = 0;
    let errors = 0;

    for (const user of users) {
        try {
            const result = await calculateSMEScore(user.id, true);
            console.log(`✓ ${user.username || user.full_name || user.id}: ${result.score} points → ${result.levelName} (Level ${result.level})`);
            updated++;
        } catch (error) {
            console.error(`✗ Error updating ${user.username || user.id}:`, error.message);
            errors++;
        }
    }

    console.log(`\nRecalculation complete!`);
    console.log(`- Updated: ${updated} users`);
    console.log(`- Errors: ${errors} users`);

    process.exit(0);
}

recalculateAllScores().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
