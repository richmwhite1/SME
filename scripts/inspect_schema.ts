
import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function inspectSchema() {
    try {
        const columns = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'products'
    `;

        console.log('Products Table Schema:');
        columns.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (${col.udt_name})`);
        });

        const checkConstraints = await sql`
        SELECT pg_get_constraintdef(c.oid) AS constraint_def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'products' AND c.contype = 'c';
    `;

        console.log('\nConstraints:');
        checkConstraints.forEach(c => console.log(c.constraint_def));

    } catch (error) {
        console.error('Error inspecting schema:', error);
    } finally {
        await sql.end();
    }
}

inspectSchema();
