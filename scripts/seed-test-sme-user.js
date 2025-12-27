#!/usr/bin/env node

/**
 * Seed Test SME User Script
 * 
 * This script seeds the test user (richmwhite@gmail.com) with enough upvotes
 * to reach the SME reputation threshold (100 points).
 * 
 * Usage: node scripts/seed-test-sme-user.js
 */

const postgres = require('postgres');

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    const sql = postgres(databaseUrl, {
        ssl: 'require',
    });

    try {
        console.log('🚀 Starting SME test user seeding...\n');

        const targetEmail = 'richmwhite@gmail.com';
        const targetScore = 100;

        // Find the user by email
        console.log(`📧 Looking for user: ${targetEmail}`);
        const users = await sql`
      SELECT id, full_name, email, reputation_score, is_sme
      FROM profiles
      WHERE email = ${targetEmail}
    `;

        if (users.length === 0) {
            console.error(`❌ ERROR: User not found: ${targetEmail}`);
            console.log('\n💡 TIP: Make sure the user has signed in at least once to create their profile.');
            process.exit(1);
        }

        const user = users[0];
        console.log(`✅ Found user: ${user.full_name || user.email}`);
        console.log(`   Current reputation: ${user.reputation_score || 0}`);
        console.log(`   Current SME status: ${user.is_sme ? 'YES ⭐' : 'NO'}\n`);

        const currentReputation = user.reputation_score || 0;
        const upvotesNeeded = Math.max(0, targetScore - currentReputation);

        if (upvotesNeeded === 0) {
            console.log(`✅ User already has reputation score of ${currentReputation}`);
            console.log(`   SME Status: ${user.is_sme ? 'ACTIVE ⭐' : 'INACTIVE'}\n`);
            await sql.end();
            return;
        }

        console.log(`🎯 Target reputation: ${targetScore}`);
        console.log(`📊 Upvotes needed: ${upvotesNeeded}\n`);

        // Create a test discussion for the user if they don't have one
        console.log('📝 Checking for existing discussions...');
        const existingDiscussions = await sql`
      SELECT id, title FROM discussions 
      WHERE author_id = ${user.id} 
      LIMIT 1
    `;

        let discussionId;

        if (existingDiscussions.length === 0) {
            console.log('   Creating test discussion...');
            const newDiscussion = await sql`
        INSERT INTO discussions (
          title,
          content,
          author_id,
          slug,
          tags
        ) VALUES (
          'Test Discussion for SME Reputation Seeding',
          'This is a test discussion created to seed reputation for SME testing. This discussion was auto-generated to test the automated SME promotion system.',
          ${user.id},
          ${'test-discussion-' + user.id + '-' + Date.now()},
          ARRAY['Testing', 'SME']
        )
        RETURNING id, title
      `;
            discussionId = newDiscussion[0].id;
            console.log(`   ✅ Created: "${newDiscussion[0].title}"`);
        } else {
            discussionId = existingDiscussions[0].id;
            console.log(`   ✅ Using existing: "${existingDiscussions[0].title}"`);
        }

        console.log(`\n👥 Creating ${upvotesNeeded} mock voters...`);

        // Create mock users to vote
        const mockVoterIds = [];
        for (let i = 0; i < upvotesNeeded; i++) {
            mockVoterIds.push(`mock_voter_${i}_${Date.now()}`);
        }

        // Insert mock profiles for voters
        for (const voterId of mockVoterIds) {
            await sql`
        INSERT INTO profiles (id, full_name, email)
        VALUES (
          ${voterId},
          'Mock Voter',
          ${voterId + '@test.com'}
        )
        ON CONFLICT (id) DO NOTHING
      `;
        }

        console.log(`   ✅ Created ${mockVoterIds.length} mock voter profiles\n`);

        // Add upvotes from mock users
        console.log('⬆️  Adding upvotes...');
        let votesAdded = 0;
        for (const voterId of mockVoterIds) {
            try {
                await sql`
          INSERT INTO discussion_votes (user_id, discussion_id)
          VALUES (${voterId}, ${discussionId})
          ON CONFLICT (user_id, discussion_id) DO NOTHING
        `;
                votesAdded++;
                if (votesAdded % 10 === 0) {
                    process.stdout.write(`   Progress: ${votesAdded}/${upvotesNeeded}\r`);
                }
            } catch (err) {
                console.error(`   ⚠️  Failed to add vote from ${voterId}:`, err.message);
            }
        }

        console.log(`   ✅ Added ${votesAdded} upvotes\n`);

        // Update the discussion's upvote count
        console.log('📊 Updating discussion upvote count...');
        await sql`
      UPDATE discussions
      SET upvote_count = upvote_count + ${votesAdded}
      WHERE id = ${discussionId}
    `;
        console.log('   ✅ Updated\n');

        // Recalculate the user's reputation (this will trigger is_sme update via trigger)
        console.log('🔄 Recalculating user reputation...');
        const reputationResult = await sql`
      SELECT * FROM recalculate_and_update_reputation(${user.id})
    `;

        if (reputationResult.length === 0) {
            console.error('   ❌ Failed to recalculate reputation');
            await sql.end();
            process.exit(1);
        }

        const result = reputationResult[0];
        console.log('   ✅ Recalculation complete\n');

        // Get updated user status
        const updatedUsers = await sql`
      SELECT reputation_score, is_sme, full_name
      FROM profiles
      WHERE id = ${user.id}
    `;

        const updatedUser = updatedUsers[0];

        // Display results
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ SME TEST USER SEEDING COMPLETE');
        console.log('═══════════════════════════════════════════════════');
        console.log(`👤 User: ${updatedUser.full_name || targetEmail}`);
        console.log(`📧 Email: ${targetEmail}`);
        console.log(`📊 Old Reputation: ${result.old_reputation || 0}`);
        console.log(`📊 New Reputation: ${updatedUser.reputation_score}`);
        console.log(`⭐ Old SME Status: ${result.old_sme_status ? 'YES' : 'NO'}`);
        console.log(`⭐ New SME Status: ${updatedUser.is_sme ? 'YES ✅' : 'NO ❌'}`);
        console.log(`🎯 Votes Added: ${votesAdded}`);
        console.log('═══════════════════════════════════════════════════\n');

        if (updatedUser.is_sme) {
            console.log('🎉 SUCCESS! User has been promoted to SME status!');
            console.log('📝 Next steps:');
            console.log('   1. Sign in as richmwhite@gmail.com');
            console.log('   2. Check user dropdown for "SME Dashboard" link');
            console.log('   3. Navigate to /sme-dashboard to verify access');
        } else {
            console.log('⚠️  WARNING: User reputation is below threshold');
            console.log(`   Current: ${updatedUser.reputation_score}, Required: 100`);
        }

        console.log('');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
