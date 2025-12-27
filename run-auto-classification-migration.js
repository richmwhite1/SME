import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
}

console.log('🔗 Connecting to database...');
const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, 'migrations', 'add-auto-classification-fields.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔄 Running auto-classification migration...');
        await sql.unsafe(migrationSQL);
        console.log('✅ Migration completed successfully!');

        // Verify the columns were added
        const discussionCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'discussion_comments' 
      AND column_name IN ('post_type', 'pillar_of_truth', 'source_metadata')
      ORDER BY column_name;
    `;

        const productCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_comments' 
      AND column_name IN ('post_type', 'pillar_of_truth', 'source_metadata')
      ORDER BY column_name;
    `;

        console.log('\n📊 Verification:');
        console.log(`  discussion_comments: ${discussionCheck.length}/3 columns added`);
        console.log(`  product_comments: ${productCheck.length}/3 columns added`);

        if (discussionCheck.length === 3 && productCheck.length === 3) {
            console.log('\n✅ All auto-classification columns added successfully!');
        } else {
            console.log('\n⚠️  Some columns may be missing. Check the output above.');
        }

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

runMigration();
