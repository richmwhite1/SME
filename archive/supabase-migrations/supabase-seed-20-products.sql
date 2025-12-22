-- =====================================================
-- Seed 20 Holistic Health Products
-- =====================================================
-- Run this SQL in Supabase SQL Editor to populate products
-- =====================================================

-- Clear existing products (optional - comment out if you want to keep existing)
-- DELETE FROM product_comments WHERE protocol_id IN (SELECT id FROM protocols);
-- DELETE FROM reviews WHERE protocol_id IN (SELECT id FROM protocols);
-- DELETE FROM protocol_items WHERE protocol_id IN (SELECT id FROM protocols);
-- DELETE FROM protocols;

-- =====================================================
-- 20 Holistic Health Products
-- =====================================================

-- Product 1: Magnesium Glycinate
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Magnesium Glycinate Complex',
  'Addresses magnesium deficiency, supports muscle relaxation, improves sleep quality, and enhances stress resilience',
  'magnesium-glycinate-complex',
  NULL,
  'Magnesium glycinate represents one of the most bioavailable forms of magnesium, bound to glycine for enhanced absorption and minimal gastrointestinal distress. Research demonstrates superior tissue penetration compared to oxide or citrate forms.',
  'https://example.com/magnesium?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/21199787',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/magnesium.pdf'
);

-- Product 2: Omega-3 EPA/DHA
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'High-Potency Omega-3 EPA/DHA',
  'Supports cardiovascular health, reduces inflammation, enhances cognitive function, and promotes optimal brain development',
  'high-potency-omega-3-epa-dha',
  NULL,
  'EPA and DHA represent the most clinically relevant omega-3 fatty acids, derived from cold-water fish sources. Meta-analyses demonstrate consistent reductions in triglyceride levels and improvements in endothelial function.',
  'https://example.com/omega3?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/22332096',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/omega3.pdf'
);

-- Product 3: Probiotic Multi-Strain
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Multi-Strain Probiotic Complex',
  'Restores gut microbiome balance, supports digestive health, enhances immune function, and improves nutrient absorption',
  'multi-strain-probiotic-complex',
  NULL,
  'Comprehensive probiotic formulation containing 50 billion CFU across 12 clinically studied strains. Delayed-release capsules with acid-resistant coating ensure >90% survival through stomach acid.',
  'https://example.com/probiotic?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/24912386',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/probiotic.pdf'
);

-- Product 4: Vitamin D3 + K2
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Vitamin D3 + K2 MK-7',
  'Addresses vitamin D deficiency, supports bone health, enhances calcium absorption, and promotes cardiovascular wellness',
  'vitamin-d3-k2-mk7',
  NULL,
  'Synergistic combination addressing the critical relationship between vitamin D3 and K2 in calcium metabolism. While D3 enhances calcium absorption, K2 directs calcium to bones and away from soft tissues.',
  'https://example.com/d3k2?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/21157097',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/d3k2.pdf'
);

-- Product 5: Turmeric Curcumin
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Bioavailable Turmeric Curcumin',
  'Reduces inflammation, supports joint health, enhances antioxidant capacity, and promotes healthy aging',
  'bioavailable-turmeric-curcumin',
  NULL,
  'Curcumin demonstrates remarkable anti-inflammatory and antioxidant properties. This formulation utilizes piperine and phospholipid complexation to increase bioavailability by up to 2000%.',
  'https://example.com/curcumin?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/17569207',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/curcumin.pdf'
);

-- Product 6: Ashwagandha
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'KSM-66 Ashwagandha Root Extract',
  'Reduces stress and anxiety, supports adrenal health, enhances sleep quality, and improves cognitive function',
  'ksm66-ashwagandha-root-extract',
  NULL,
  'Full-spectrum root extract standardized to 5% withanolides. Over 200 studies document stress-modulating and neuroprotective effects. Reduces cortisol production while enhancing resilience to physical and psychological stressors.',
  'https://example.com/ashwagandha?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23439798',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/ashwagandha.pdf'
);

-- Product 7: Zinc Picolinate
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Zinc Picolinate',
  'Supports immune function, promotes wound healing, enhances taste and smell, and supports reproductive health',
  'zinc-picolinate',
  NULL,
  'Zinc ranks among the most critical trace minerals, involved in over 300 enzymatic reactions. Picolinic acid chelation significantly enhances zinc absorption compared to inorganic forms, with 43% greater absorption than zinc sulfate.',
  'https://example.com/zinc?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/19254915',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/zinc.pdf'
);

-- Product 8: CoQ10 Ubiquinol
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Ubiquinol CoQ10',
  'Supports cellular energy production, enhances cardiovascular health, provides antioxidant protection, and supports healthy aging',
  'ubiquinol-coq10',
  NULL,
  'Ubiquinol represents the active, reduced form of coenzyme Q10, providing superior bioavailability compared to ubiquinone. Achieves 3-4x higher plasma levels and requires no conversion in the body.',
  'https://example.com/coq10?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/17645676',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/coq10.pdf'
);

-- Product 9: B-Complex
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Active B-Complex',
  'Supports energy metabolism, enhances cognitive function, promotes nervous system health, and aids in stress management',
  'active-b-complex',
  NULL,
  'Comprehensive B-vitamin complex utilizing activated, methylated forms that bypass genetic polymorphisms affecting B-vitamin metabolism. Includes methylfolate, methylcobalamin, P-5-P, and riboflavin-5-phosphate.',
  'https://example.com/b-complex?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/15585708',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/bcomplex.pdf'
);

-- Product 10: NAC
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'N-Acetyl Cysteine (NAC)',
  'Supports glutathione production, enhances liver detoxification, improves respiratory health, and provides antioxidant protection',
  'n-acetyl-cysteine-nac',
  NULL,
  'NAC serves as a direct precursor to glutathione, the body''s master antioxidant. Unlike oral glutathione, which is poorly absorbed, NAC effectively raises intracellular glutathione levels through de novo synthesis.',
  'https://example.com/nac?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/25722144',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/nac.pdf'
);

-- Product 11: Quercetin
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Quercetin with Bromelain',
  'Reduces inflammation, supports immune function, provides antioxidant protection, and enhances exercise recovery',
  'quercetin-with-bromelain',
  NULL,
  'Quercetin demonstrates potent anti-inflammatory and antioxidant properties. This formulation includes bromelain (pineapple enzyme) to enhance quercetin absorption and provide additional anti-inflammatory benefits.',
  'https://example.com/quercetin?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/26957296',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/quercetin.pdf'
);

-- Product 12: Melatonin
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Extended-Release Melatonin',
  'Improves sleep quality, regulates circadian rhythm, reduces jet lag symptoms, and supports healthy sleep-wake cycles',
  'extended-release-melatonin',
  NULL,
  'Extended-release formulation mimics natural melatonin secretion patterns, providing sustained sleep support throughout the night. Prevents early-morning awakenings and supports deeper, more restorative sleep.',
  'https://example.com/melatonin?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23853635',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/melatonin.pdf'
);

-- Product 13: Rhodiola Rosea
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Rhodiola Rosea Extract',
  'Enhances mental performance, reduces fatigue, improves stress resilience, and supports physical endurance',
  'rhodiola-rosea-extract',
  NULL,
  'Standardized to 3% rosavins and 1% salidroside. Functions as a true adaptogen, helping the body maintain homeostasis during physical and psychological stress. Enhances performance without depleting energy reserves.',
  'https://example.com/rhodiola?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/19016404',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/rhodiola.pdf'
);

-- Product 14: Alpha-Lipoic Acid
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'R-Alpha-Lipoic Acid',
  'Supports blood sugar regulation, provides antioxidant protection, enhances nerve health, and supports healthy aging',
  'r-alpha-lipoic-acid',
  NULL,
  'R-ALA represents the natural, biologically active enantiomer, providing superior efficacy compared to racemic mixtures. Functions in both water and fat-soluble environments, recycling vitamin C, E, and glutathione.',
  'https://example.com/ala?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/18390739',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/ala.pdf'
);

-- Product 15: Resveratrol
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Trans-Resveratrol',
  'Supports cardiovascular health, provides antioxidant protection, promotes healthy aging, and enhances cellular function',
  'trans-resveratrol',
  NULL,
  'Trans-resveratrol activates SIRT1, a class of proteins linked to longevity and metabolic health. This formulation includes piperine to enhance absorption and utilizes micronized particles for improved dissolution.',
  'https://example.com/resveratrol?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/17569207',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/resveratrol.pdf'
);

-- Product 16: Spirulina
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Organic Spirulina Powder',
  'Provides complete protein, supports immune function, enhances energy levels, and delivers essential nutrients',
  'organic-spirulina-powder',
  NULL,
  'One of nature''s most nutrient-dense foods, providing 60-70% complete protein by weight, all essential amino acids, B-vitamins, highly absorbable iron, and beta-carotene. Third-party tested and certified organic.',
  'https://example.com/spirulina?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23754631',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/spirulina.pdf'
);

-- Product 17: Chlorella
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Broken Cell Wall Chlorella',
  'Supports detoxification, enhances immune function, provides complete nutrition, and promotes digestive health',
  'broken-cell-wall-chlorella',
  NULL,
  'Broken-cell-wall formulation ensures maximum nutrient bioavailability. Offers exceptional nutritional density and unique detoxification properties, including heavy metal binding and highest chlorophyll concentration of any food.',
  'https://example.com/chlorella?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/22280495',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/chlorella.pdf'
);

-- Product 18: Lion's Mane
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Lion''s Mane Mushroom Extract',
  'Enhances cognitive function, supports nerve regeneration, improves memory, and promotes neuroplasticity',
  'lions-mane-mushroom-extract',
  NULL,
  'Dual-extract (water and alcohol) ensures extraction of both water-soluble and alcohol-soluble bioactive compounds. Stimulates production of NGF and BDNF, proteins critical for neurogenesis, synaptic plasticity, and nerve regeneration.',
  'https://example.com/lions-mane?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/24266378',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/lionsmane.pdf'
);

-- Product 19: Reishi
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Reishi Mushroom Extract',
  'Supports immune function, promotes relaxation, enhances sleep quality, and provides adaptogenic stress support',
  'reishi-mushroom-extract',
  NULL,
  'Dual-extract provides both water-soluble beta-glucans and alcohol-soluble triterpenes. Exhibits unique immunomodulatory properties, dramatically increases NK cell activity, and enhances GABAergic neurotransmission for relaxation.',
  'https://example.com/reishi?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23557365',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/reishi.pdf'
);

-- Product 20: Cordyceps
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, is_flagged, coa_url
) VALUES (
  gen_random_uuid(),
  'Cordyceps Sinensis Extract',
  'Enhances athletic performance, supports respiratory health, boosts energy levels, and improves oxygen utilization',
  'cordyceps-sinensis-extract',
  NULL,
  'Standardized cordycepin and adenosine content. Increases maximum oxygen consumption by 5-15%, extends time to exhaustion, and enhances cellular energy generation. Improves oxygen uptake and delivery.',
  'https://example.com/cordyceps?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23261430',
  true, true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  false, 'https://example.com/coa/cordyceps.pdf'
);

-- =====================================================
-- COMPLETE
-- =====================================================
-- 20 holistic health products have been created with:
-- - All 5-pillar certification fields set to true
-- - Placeholder images from Unsplash
-- - Comprehensive descriptions and summaries
-- - Reference URLs to PubMed studies
-- - is_flagged set to false (so they appear on the products page)
-- =====================================================




