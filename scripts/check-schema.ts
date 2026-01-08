import { getDb } from '../lib/db';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function check() {
    const sql = getDb();

    console.log("Checking DISCUSSIONS columns:");
    const discussions = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'discussions'
  `;
    console.log(JSON.stringify(discussions, null, 2));

    process.exit(0);
}
check();
