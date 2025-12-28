
import { getDb } from '@/lib/db';

async function testQuery() {
    const sql = getDb();

    try {
        console.log('Testing product query...');
        const products = await sql`
      SELECT 
        id,
        title,
        slug,
        created_at,
        is_sme_certified,
        certification_notes,
        third_party_lab_verified,
        purity_tested,
        source_transparency,
        potency_verified,
        excipient_audit,
        operational_legitimacy,
        coa_url,
        admin_status,
        certification_tier,
        admin_notes,
        sme_signals,
        technical_specs,
        technical_docs_url as tech_docs,
        target_audience,
        core_value_proposition,
        sme_access_note,
        youtube_link as video_url,
        reference_url as citation_url
      FROM products
      ORDER BY created_at DESC
    `;
        console.log('Query successful. Rows:', products.length);
        if (products.length > 0) {
            console.log('First row:', products[0]);
        }
    } catch (err) {
        console.error('Query failed:', err);
    }
}

testQuery();
