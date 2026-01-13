import { getDb } from "./lib/db";

async function checkColumns() {
    const sql = getDb();
    try {
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products';
    `;
        console.log("Existing columns in 'products':", columns.map(c => c.column_name).sort());
    } catch (err) {
        console.error("Error fetching columns:", err);
    }
}

checkColumns();
