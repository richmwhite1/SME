
import { getDb } from '@/lib/db';

async function checkColumns() {
    const sql = getDb();

    try {
        const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `;
        console.log('Columns in products table:', columns.map(c => c.column_name).sort());
    } catch (err) {
        console.error('Error checking columns:', err);
    }
}

checkColumns();
