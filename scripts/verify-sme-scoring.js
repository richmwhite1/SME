
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

// SME Scoring Constants
const CHAKRA_LEVELS = [
    { level: 1, name: 'Red Chakra', threshold: 0 },
    { level: 2, name: 'Orange Chakra', threshold: 100 },
    { level: 3, name: 'Yellow Chakra', threshold: 300 },
    { level: 4, name: 'Green Chakra', threshold: 600 },
    { level: 5, name: 'Blue Chakra', threshold: 1000 },
    { level: 6, name: 'Indigo Chakra', threshold: 2000 },
    { level: 7, name: 'Violet Chakra', threshold: 5000 }
];

const POINTS = {
    CREATE_DISCUSSION: 10,
    CREATE_COMMENT: 5,
    CREATE_REVIEW: 15,
    VERIFIED_EXPERT_BONUS: 500,
};

function getChakraLevel(score) {
    for (let i = CHAKRA_LEVELS.length - 1; i >= 0; i--) {
        if (score >= CHAKRA_LEVELS[i].threshold) {
            return CHAKRA_LEVELS[i];
        }
    }
    return CHAKRA_LEVELS[0];
}

async function verify() {
    const sql = postgres(process.env.DATABASE_URL);
    console.log('Verifying SME Scoring System (JS Mode)...');

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

        // 2. Test Scoring Logic (Simplified Simulation)
        console.log('\n2. Testing Scoring Logic...');
        const users = await sql`SELECT id FROM profiles LIMIT 1`;
        if (users.length === 0) {
            console.log('No users found to test.');
            await sql.end();
            return;
        }
        const userId = users[0].id;
        console.log(`Testing with user: ${userId}`);

        // Fetch counts
        const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM discussions WHERE author_id = ${userId}) as discussion_count,
        (SELECT COUNT(*) FROM discussion_comments WHERE author_id = ${userId}) as discussion_comment_count,
        (SELECT COUNT(*) FROM product_comments WHERE author_id = ${userId}) as product_comment_count,
        (SELECT COUNT(*) FROM reviews WHERE user_id = ${userId}) as review_count,
        (SELECT is_verified_expert FROM profiles WHERE id = ${userId}) as is_expert
    `;

        const { discussion_count, discussion_comment_count, product_comment_count, review_count, is_expert } = counts[0];

        let score = 0;
        const details = {};

        details.discussions = parseInt(discussion_count) * POINTS.CREATE_DISCUSSION;
        details.comments = (parseInt(discussion_comment_count) + parseInt(product_comment_count)) * POINTS.CREATE_COMMENT;
        details.reviews = parseInt(review_count) * POINTS.CREATE_REVIEW;
        details.expert_bonus = is_expert ? POINTS.VERIFIED_EXPERT_BONUS : 0;

        score = details.discussions + details.comments + details.reviews + details.expert_bonus;
        const chakra = getChakraLevel(score);

        console.log('Calculated:', { score, level: chakra.level, details });

        // Update DB
        await sql`
        UPDATE profiles 
        SET 
          sme_score = ${score},
          chakra_level = ${chakra.level},
          sme_score_details = ${sql.json(details)},
          last_score_update = NOW()
        WHERE id = ${userId}
    `;

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
            });

            if (Number(u.sme_score) === score && u.chakra_level === chakra.level) {
                console.log('SUCCESS: Database was updated correctly.');
            } else {
                console.error('ERROR: Database values match mismatch.');
            }
        } else {
            console.error('ERROR: Could not fetch user after update.');
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await sql.end();
    }
}

verify();
