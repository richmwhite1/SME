import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const db = getDb();

    try {
        const migrationPath = path.join(process.cwd(), 'migrations', 'add-auto-classification-fields.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔄 Running auto-classification migration...');
        await db.unsafe(sql);
        console.log('✅ Migration completed successfully!');

        // Verify the columns were added
        const discussionCheck = await db`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'discussion_comments' 
      AND column_name IN ('post_type', 'pillar_of_truth', 'source_metadata')
      ORDER BY column_name;
    `;

        const productCheck = await db`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_comments' 
      AND column_name IN ('post_type', 'pillar_of_truth', 'source_metadata')
      ORDER BY column_name;
    `;

        console.log('\n📊 Verification:');
        console.log('discussion_comments columns:', discussionCheck.length, 'added');
        console.log('product_comments columns:', productCheck.length, 'added');

        if (discussionCheck.length === 3 && productCheck.length === 3) {
            console.log('\n✅ All columns added successfully!');
        } else {
            console.log('\n⚠️  Some columns may be missing');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
