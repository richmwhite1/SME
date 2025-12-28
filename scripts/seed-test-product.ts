
import { getDb } from '@/lib/db';

async function seed() {
    const sql = getDb();

    try {
        console.log('Seeding test product...');
        const result = await sql`
      INSERT INTO products (
        title, 
        slug, 
        is_sme_certified,
        admin_status,
        created_at,
        updated_at
      ) VALUES (
        'Test Product Alpha',
        ${'test-' + Date.now()},
        false,
        'pending_review',
        NOW(),
        NOW()
      )
      RETURNING id, title;
    `;
        console.log('Seeded:', result);
    } catch (err) {
        console.error('Error seeding:', err);
    }
}

seed();
