
import { getDb } from '../lib/db';
import { calculateSMEScore } from '../lib/sme-scoring';

async function verify() {
    const sql = getDb();
    console.log('Verifying SME Scoring System...');

    try {
        // 1. Check Database Schema
        console.log('1. Checking Database Schema...');
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('chakra_level', 'sme_score', 'sme_score_details');
    `;

        if (columns.length < 3) {
            console.error('ERROR: Missing columns in profiles table.');
            console.log('Found:', columns.map(c => c.column_name));
        } else {
            console.log('SUCCESS: All columns found.');
        }

        // 2. Test Scoring Logic
        console.log('\n2. Testing Scoring Logic...');
        // Get a test user (or first user)
        const users = await sql`SELECT id FROM profiles LIMIT 1`;
        if (users.length === 0) {
            console.log('No users found to test.');
            return;
        }
        const userId = users[0].id;
        console.log(`Testing with user: ${userId}`);

        const result = await calculateSMEScore(userId, true); // true to update DB
        console.log('Calculation Result:', result);

        if (result.level >= 1 && result.score >= 0) {
            console.log('SUCCESS: Scoring calculation returned valid data.');
        } else {
            console.error('ERROR: Invalid scoring result.');
        }

        // 3. Verify Database Update
        console.log('\n3. Verifying Database Update...');
        const updatedUser = await sql`
      SELECT sme_score, chakra_level, sme_score_details 
      FROM profiles 
      WHERE id = ${userId}
    `;

        if (updatedUser.length > 0) {
            const u = updatedUser[0];
            console.log('DB State:', {
                score: u.sme_score,
                level: u.chakra_level,
                details: u.sme_score_details
            });

            // Compare broadly primarily on existence
            if (Number(u.sme_score) === result.score && u.chakra_level === result.level) {
                console.log('SUCCESS: Database was updated correctly.');
            } else {
                console.error('ERROR: Database values match mismatch (might be type coercion issue, check logs).');
            }
        } else {
            console.error('ERROR: Could not fetch user after update.');
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        process.exit(0);
    }
}

// We need to allow top-level await or wrap in IIFE if not module, but ts-node handles it usually.
// For safety given the environment:
verify();
