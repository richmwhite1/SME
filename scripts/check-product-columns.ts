
import postgres from 'postgres';

async function checkProductColumns() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("Missing DATABASE_URL");
        process.exit(1);
    }

    const sql = postgres(databaseUrl);

    try {
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `;

        console.log("Columns in 'products' table:");
        columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

        const requiredColumns = ['category', 'tagline', 'product_photos', 'admin_status'];
        const missing = requiredColumns.filter(rc => !columns.some(c => c.column_name === rc));

        if (missing.length > 0) {
            console.error("Missing columns:", missing);
            process.exit(1);
        } else {
            console.log("All required columns present.");
        }
    } catch (err) {
        console.error("Error checking columns:", err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

checkProductColumns();
