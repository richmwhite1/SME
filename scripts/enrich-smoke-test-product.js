require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
});

async function populateProduct() {
    const productId = '1f2cef75-5276-4d0a-8492-56187137727a';

    try {
        console.log('Populating Smoke Test Omega with rich data...');

        // We update fields one by one or in groups to avoid complex type issues if possible due to 'postgres' lib quirks
        await sql`
      UPDATE products
      SET
        tagline = 'Advanced Cellular Resilience Complex',
        company_blurb = 'Omega Corp pioneers bio-available marine nutrients sourced from pristine Antarctic waters, verified by blockchain traceability.',
        core_value_proposition = 'Delivers 3x higher phospholipid uptake for enhanced cognitive function and cellular membrane integrity.',
        target_audience = 'Biohackers, Elite Athletes, Cognitive Performance Seekers',
        ingredients = ARRAY['Krill Oil Concentrate', 'Astaxanthin (4mg)', 'Phosphatidylcholine', 'Superba Boost™'],
        problem_solved = 'Combats systemic inflammation and cognitive fog through optimized lipid delivery systems lacking in standard fish oils.',
        ai_summary = '# Executive Summary\n\nSmoke Test Omega represents a significant leap in lipid delivery technology. Unlike ester-based standard fish oils, this phospholipid-bound formation ensures direct transport across the blood-brain barrier.\n\n### Key Differentiators\n- **purity**: Molecularly distilled\n- **Absorption**: Hydro-soluble phospholipid form\n- **Stability**: Naturally preserved with Astaxanthin',
        images = ARRAY['https://images.unsplash.com/photo-1550572782-526087b56a93?auto=format&fit=crop&q=80&w=2600&ixlib=rb-4.0.3'],
        technical_specs = ${JSON.stringify({
            serving_size: "2 Softgels",
            servings_per_container: 30,
            epa: "300mg",
            dha: "250mg",
            total_phospholipids: "560mg"
        })}
      WHERE id = ${productId}
    `;

        console.log('✅ Product enriched successfully!');
    } catch (error) {
        console.error('❌ Error updating product:', error);
    } finally {
        process.exit();
    }
}

populateProduct();
