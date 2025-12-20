import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (optional - remove if you want anyone to seed)
  const sql = getDb();
  try {
    const profile = await sql`
      SELECT is_admin FROM profiles WHERE id = ${userId} LIMIT 1
    `;
    
    if (!profile[0]?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  } catch (error) {
    // If admin check fails, continue anyway (for development)
    console.warn('Admin check failed, continuing with seed:', error);
  }

  const products = [
    {
      title: 'Probiotics - Multi-Strain',
      slug: 'probiotics-multi-strain',
      problem_solved: 'Supports gut health, digestion, and immune function with a diverse blend of beneficial bacteria strains',
      ai_summary: 'A comprehensive probiotic supplement featuring multiple strains of beneficial bacteria including Lactobacillus and Bifidobacterium species. Formulated to support digestive health, enhance immune function, and maintain a balanced gut microbiome. Ideal for individuals seeking to improve gut health, reduce bloating, and support overall wellness.',
      buy_url: 'https://example.com/products/probiotics',
      reference_url: 'https://pubmed.ncbi.nlm.nih.gov/probiotics-research',
      images: [],
      is_sme_certified: true,
      third_party_lab_verified: true,
      purity_tested: true,
      source_transparency: true,
      potency_verified: true,
      excipient_audit: true,
      operational_legitimacy: true,
    },
    {
      title: 'Magnesium Glycinate',
      slug: 'magnesium-glycinate',
      problem_solved: 'Addresses magnesium deficiency, supports muscle relaxation, sleep quality, and stress management',
      ai_summary: 'High-quality magnesium glycinate supplement providing highly bioavailable magnesium in a gentle form. Magnesium is essential for over 300 biochemical reactions in the body, including muscle function, nerve transmission, and energy production. This form is particularly well-tolerated and effective for supporting sleep, reducing muscle cramps, and managing stress.',
      buy_url: 'https://example.com/products/magnesium',
      reference_url: 'https://pubmed.ncbi.nlm.nih.gov/magnesium-research',
      images: [],
      is_sme_certified: true,
      third_party_lab_verified: true,
      purity_tested: true,
      source_transparency: true,
      potency_verified: true,
      excipient_audit: false,
      operational_legitimacy: true,
    },
    {
      title: 'Ashwagandha Root Extract',
      slug: 'ashwagandha-root-extract',
      problem_solved: 'Helps manage stress, improve sleep quality, support cognitive function, and enhance energy levels',
      ai_summary: 'Standardized Ashwagandha root extract containing key bioactive compounds including withanolides. This adaptogenic herb has been used in Ayurvedic medicine for centuries to help the body adapt to stress. Research suggests it may support cortisol regulation, improve sleep quality, enhance cognitive function, and boost energy levels naturally.',
      buy_url: 'https://example.com/products/ashwagandha',
      reference_url: 'https://pubmed.ncbi.nlm.nih.gov/ashwagandha-research',
      images: [],
      is_sme_certified: false,
      third_party_lab_verified: true,
      purity_tested: true,
      source_transparency: true,
      potency_verified: true,
      excipient_audit: false,
      operational_legitimacy: true,
    },
    {
      title: 'Omega-3 EPA/DHA',
      slug: 'omega-3-epa-dha',
      problem_solved: 'Supports cardiovascular health, brain function, inflammation management, and overall cellular health',
      ai_summary: 'High-potency omega-3 fatty acid supplement providing EPA and DHA from sustainably sourced fish oil. These essential fatty acids play crucial roles in cardiovascular health, brain function, eye health, and inflammation regulation. This supplement is molecularly distilled for purity and provides optimal ratios of EPA to DHA for maximum bioavailability.',
      buy_url: 'https://example.com/products/omega3',
      reference_url: 'https://pubmed.ncbi.nlm.nih.gov/omega3-research',
      images: [],
      is_sme_certified: true,
      third_party_lab_verified: true,
      purity_tested: true,
      source_transparency: true,
      potency_verified: true,
      excipient_audit: true,
      operational_legitimacy: true,
    },
    {
      title: 'Vitamin D3 + K2',
      slug: 'vitamin-d3-k2',
      problem_solved: 'Addresses vitamin D deficiency, supports bone health, immune function, and cardiovascular wellness',
      ai_summary: 'Comprehensive vitamin D3 and K2 supplement designed to optimize calcium absorption and bone health. Vitamin D3 supports immune function, mood regulation, and overall health, while vitamin K2 ensures calcium is directed to bones rather than soft tissues. This combination is particularly important for individuals with limited sun exposure or those living in northern climates.',
      buy_url: 'https://example.com/products/vitamin-d3-k2',
      reference_url: 'https://pubmed.ncbi.nlm.nih.gov/vitamin-d-research',
      images: [],
      is_sme_certified: true,
      third_party_lab_verified: true,
      purity_tested: true,
      source_transparency: true,
      potency_verified: true,
      excipient_audit: true,
      operational_legitimacy: true,
    },
  ];

  try {
    const inserted = [];
    for (const product of products) {
      const result = await sql`
        INSERT INTO protocols (
          title,
          slug,
          problem_solved,
          ai_summary,
          buy_url,
          reference_url,
          images,
          is_sme_certified,
          third_party_lab_verified,
          purity_tested,
          source_transparency,
          potency_verified,
          excipient_audit,
          operational_legitimacy
        ) VALUES (
          ${product.title},
          ${product.slug},
          ${product.problem_solved},
          ${product.ai_summary},
          ${product.buy_url},
          ${product.reference_url},
          ${sql.array(product.images)},
          ${product.is_sme_certified},
          ${product.third_party_lab_verified},
          ${product.purity_tested},
          ${product.source_transparency},
          ${product.potency_verified},
          ${product.excipient_audit},
          ${product.operational_legitimacy}
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id, title, slug
      `;
      
      if (result.length > 0) {
        inserted.push(result[0]);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${inserted.length} products`,
      products: inserted,
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

