-- =====================================================
-- Seed Holistic Products with Images
-- =====================================================
-- Deletes existing products and seeds 20 realistic holistic products
-- =====================================================

-- Delete all existing products (and related data)
DELETE FROM product_comments WHERE protocol_id IN (SELECT id FROM protocols);
DELETE FROM reviews WHERE protocol_id IN (SELECT id FROM protocols);
DELETE FROM protocol_items WHERE protocol_id IN (SELECT id FROM protocols);
DELETE FROM protocols;

-- Reset sequence if using serial IDs (not needed for UUID)
-- ALTER SEQUENCE protocols_id_seq RESTART WITH 1;

-- =====================================================
-- Seed 20 Holistic Products
-- =====================================================

-- Product 1: Magnesium Glycinate
INSERT INTO protocols (
  id,
  title,
  problem_solved,
  slug,
  created_by,
  ai_summary,
  buy_url,
  reference_url,
  is_sme_certified,
  source_transparency,
  purity_tested,
  potency_verified,
  excipient_audit,
  operational_legitimacy,
  third_party_lab_verified,
  coa_url,
  images,
  lab_tested,
  organic,
  purity_verified,
  third_party_coa
) VALUES (
  gen_random_uuid(),
  'Magnesium Glycinate Complex',
  'Addresses magnesium deficiency, supports muscle relaxation, improves sleep quality, and enhances stress resilience',
  'magnesium-glycinate-complex',
  '00000000-0000-0000-0000-000000000000',
  '# Magnesium Glycinate: The Bioavailable Mineral for Deep Rest

Magnesium glycinate represents one of the most bioavailable forms of magnesium, bound to glycine for enhanced absorption and minimal gastrointestinal distress. This chelated form bypasses common digestive issues associated with other magnesium salts.

## Clinical Evidence

Research demonstrates that magnesium glycinate achieves superior tissue penetration compared to oxide or citrate forms. The glycine component serves dual purposes: enhancing mineral transport and providing independent neurological benefits through NMDA receptor modulation.

## Mechanism of Action

- **Cellular Uptake**: Glycine chelation improves intestinal absorption by 30-40% over inorganic forms
- **Blood-Brain Barrier**: Enhanced permeability allows for central nervous system effects
- **Muscle Function**: Direct involvement in ATP synthesis and calcium channel regulation
- **Sleep Architecture**: GABAergic activity promotion through glycine co-transport

## Dosage Protocol

**Evening Administration**: 200-400mg elemental magnesium (typically 2-4 capsules)
**Timing**: 30-60 minutes before desired sleep onset
**Duration**: Continuous use for optimal results

## Safety Profile

Magnesium glycinate exhibits exceptional tolerability with minimal laxative effects. Upper intake levels are rarely reached due to renal clearance mechanisms.',
  'https://example.com/magnesium-glycinate?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/21199787',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  'https://example.com/coa/magnesium-glycinate.pdf',
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  true,
  false,
  true,
  true
);

-- Product 2: Omega-3 EPA/DHA
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'High-Potency Omega-3 EPA/DHA',
  'Supports cardiovascular health, reduces inflammation, enhances cognitive function, and promotes optimal brain development',
  'high-potency-omega-3-epa-dha',
  '00000000-0000-0000-0000-000000000000',
  '# Omega-3 Fatty Acids: Essential for Cellular Health

EPA (eicosapentaenoic acid) and DHA (docosahexaenoic acid) represent the most clinically relevant omega-3 fatty acids, derived from cold-water fish sources. These long-chain polyunsaturated fats cannot be efficiently synthesized endogenously and must be obtained through diet or supplementation.

## Cardiovascular Benefits

Meta-analyses demonstrate consistent reductions in triglyceride levels (15-30%) and improvements in endothelial function. EPA specifically shows anti-inflammatory properties through competitive inhibition of arachidonic acid metabolism.

## Cognitive Enhancement

DHA comprises 40% of brain phospholipids and is critical for neurogenesis and synaptic plasticity. Studies link adequate DHA status with improved memory consolidation and reduced age-related cognitive decline.

## Quality Considerations

- **Molecular Distillation**: Ensures removal of heavy metals and environmental contaminants
- **Triglyceride Form**: Superior bioavailability compared to ethyl ester forms
- **Antioxidant Protection**: Natural tocopherols prevent oxidation
- **Third-Party Testing**: Verified for purity and potency

**Recommended Dosage**: 1-2g combined EPA/DHA daily for general health, 2-4g for therapeutic applications.',
  'https://example.com/omega-3?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/22332096',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 3: Probiotic Multi-Strain
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Multi-Strain Probiotic Complex',
  'Restores gut microbiome balance, supports digestive health, enhances immune function, and improves nutrient absorption',
  'multi-strain-probiotic-complex',
  '00000000-0000-0000-0000-000000000000',
  '# Probiotic Multi-Strain: Restoring Microbial Balance

This comprehensive probiotic formulation contains 50 billion CFU across 12 clinically studied strains, designed to restore and maintain optimal gut microbiome diversity. Each strain has been selected for specific functional benefits and demonstrated survival through gastric transit.

## Strain-Specific Benefits

- **Lactobacillus acidophilus**: Primary colonizer, supports lactose digestion
- **Bifidobacterium bifidum**: Dominant in healthy infants, supports immune development
- **Lactobacillus rhamnosus**: Adhesion to intestinal epithelium, pathogen exclusion
- **Bifidobacterium longum**: Butyrate production, anti-inflammatory effects
- **Lactobacillus plantarum**: Broad-spectrum antimicrobial activity

## Delivery Technology

Delayed-release capsules with acid-resistant coating ensure >90% survival through stomach acid. Prebiotic fiber (FOS) included to support probiotic growth and activity in the colon.

## Clinical Applications

- Antibiotic-associated diarrhea prevention
- Irritable bowel syndrome symptom management
- Immune system modulation
- Traveler''s diarrhea prevention

**Dosage**: 1 capsule daily with food, or 2 capsules for therapeutic applications.',
  'https://example.com/probiotic?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/24912386',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 4: Vitamin D3 + K2
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Vitamin D3 + K2 MK-7',
  'Addresses vitamin D deficiency, supports bone health, enhances calcium absorption, and promotes cardiovascular wellness',
  'vitamin-d3-k2-mk7',
  '00000000-0000-0000-0000-000000000000',
  '# Vitamin D3 + K2: The Bone and Cardiovascular Synergy

This synergistic combination addresses the critical relationship between vitamin D3 (cholecalciferol) and vitamin K2 (menaquinone-7) in calcium metabolism and bone health. While D3 enhances calcium absorption, K2 directs calcium to bones and away from soft tissues.

## Vitamin D3 Benefits

- **Immune Function**: Modulates T-cell responses and reduces inflammatory cytokine production
- **Bone Mineralization**: Essential for calcium absorption and bone remodeling
- **Mood Regulation**: Receptors present throughout the brain, linked to serotonin synthesis
- **Muscle Function**: Required for optimal muscle strength and coordination

## Vitamin K2 (MK-7) Benefits

- **Osteocalcin Activation**: Carboxylates osteocalcin, enabling bone matrix binding
- **Arterial Health**: Activates matrix Gla protein, preventing vascular calcification
- **Long Half-Life**: MK-7 form provides sustained activity (72 hours vs 2 hours for K1)

## Synergistic Effects

Research demonstrates that D3 and K2 together provide superior bone density improvements compared to D3 alone. The combination reduces risk of arterial calcification associated with high-dose D3 supplementation.

**Dosage**: 2000-5000 IU D3 with 100-200mcg K2 MK-7 daily, preferably with fat-containing meal.',
  'https://example.com/d3-k2?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/21157097',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 5: Turmeric Curcumin
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Bioavailable Turmeric Curcumin',
  'Reduces inflammation, supports joint health, enhances antioxidant capacity, and promotes healthy aging',
  'bioavailable-turmeric-curcumin',
  '00000000-0000-0000-0000-000000000000',
  '# Curcumin: The Golden Anti-Inflammatory

Curcumin, the primary bioactive compound in turmeric (Curcuma longa), demonstrates remarkable anti-inflammatory and antioxidant properties. However, native curcumin suffers from poor bioavailability due to rapid metabolism and limited absorption.

## Enhanced Bioavailability Technology

This formulation utilizes piperine (black pepper extract) and phospholipid complexation to increase curcumin bioavailability by up to 2000%. The phospholipid delivery system creates micelles that protect curcumin through the digestive tract.

## Mechanism of Action

- **NF-κB Inhibition**: Suppresses pro-inflammatory transcription factor activation
- **COX-2 Modulation**: Reduces production of inflammatory prostaglandins
- **Antioxidant Activity**: Direct free radical scavenging and Nrf2 pathway activation
- **Microbiome Support**: Promotes beneficial gut bacteria growth

## Clinical Applications

- Osteoarthritis pain and stiffness reduction
- Post-exercise inflammation and recovery
- Inflammatory bowel disease support
- Age-related cognitive decline prevention

**Dosage**: 500-1000mg curcumin (with enhanced absorption technology) 1-2 times daily with meals.',
  'https://example.com/curcumin?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/17569207',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 6: Ashwagandha
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'KSM-66 Ashwagandha Root Extract',
  'Reduces stress and anxiety, supports adrenal health, enhances sleep quality, and improves cognitive function',
  'ksm66-ashwagandha-root-extract',
  '00000000-0000-0000-0000-000000000000',
  '# Ashwagandha: The Adaptogenic Stress Modulator

Ashwagandha (Withania somnifera) stands as one of the most extensively researched adaptogenic herbs, with over 200 studies documenting its stress-modulating and neuroprotective effects. KSM-66 represents a full-spectrum root extract standardized to 5% withanolides.

## Adaptogenic Mechanism

Adaptogens function by modulating the hypothalamic-pituitary-adrenal (HPA) axis, helping the body maintain homeostasis during stress. Ashwagandha specifically reduces cortisol production while enhancing resilience to physical and psychological stressors.

## Clinical Benefits

- **Stress Reduction**: 30% reduction in cortisol levels in chronic stress populations
- **Anxiety Management**: Comparable efficacy to certain anxiolytic medications
- **Sleep Quality**: Improves sleep onset latency and total sleep time
- **Cognitive Function**: Enhances memory, attention, and information processing speed
- **Muscle Strength**: Increases muscle mass and strength in resistance training

## Withanolide Content

Withanolides are the primary bioactive compounds responsible for ashwagandha''s effects. KSM-66 provides 5% withanolides, ensuring consistent therapeutic activity across batches.

**Dosage**: 300-600mg daily, preferably in the evening or divided doses. Effects typically manifest within 2-4 weeks of consistent use.',
  'https://example.com/ashwagandha?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23439798',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80', 'https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 7: Zinc Picolinate
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Zinc Picolinate',
  'Supports immune function, promotes wound healing, enhances taste and smell, and supports reproductive health',
  'zinc-picolinate',
  '00000000-0000-0000-0000-000000000000',
  '# Zinc Picolinate: Essential Immune Support

Zinc ranks among the most critical trace minerals, involved in over 300 enzymatic reactions throughout the body. Picolinic acid chelation significantly enhances zinc absorption compared to inorganic forms like zinc oxide.

## Immune System Function

Zinc plays indispensable roles in both innate and adaptive immunity:
- **T-Cell Development**: Required for thymic function and T-lymphocyte maturation
- **Antiviral Activity**: Inhibits viral replication through RNA polymerase interference
- **Antioxidant Defense**: Component of superoxide dismutase (SOD)
- **Inflammatory Modulation**: Regulates cytokine production and NF-κB signaling

## Absorption Advantages

Picolinic acid, a natural zinc-binding ligand produced in the pancreas, creates a highly bioavailable chelate. Studies demonstrate 43% greater absorption compared to zinc sulfate, with reduced gastrointestinal side effects.

## Clinical Applications

- Common cold duration reduction (when taken at symptom onset)
- Acne management through anti-inflammatory and antimicrobial effects
- Age-related macular degeneration prevention
- Wound healing acceleration
- Taste and smell dysfunction correction

**Dosage**: 15-30mg elemental zinc daily. Higher doses (50mg+) should be time-limited to avoid copper depletion.',
  'https://example.com/zinc?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/19254915',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 8: CoQ10 Ubiquinol
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Ubiquinol CoQ10',
  'Supports cellular energy production, enhances cardiovascular health, provides antioxidant protection, and supports healthy aging',
  'ubiquinol-coq10',
  '00000000-0000-0000-0000-000000000000',
  '# Ubiquinol: The Reduced Form of CoQ10

Ubiquinol represents the active, reduced form of coenzyme Q10, providing superior bioavailability compared to ubiquinone. This form requires no conversion in the body and achieves 3-4x higher plasma levels.

## Cellular Energy Production

CoQ10 functions as an essential component of the electron transport chain in mitochondria, facilitating ATP synthesis. Every cell requires CoQ10 for energy production, with highest concentrations in heart, liver, and kidney tissues.

## Cardiovascular Benefits

- **Heart Function**: Improves ejection fraction and reduces cardiac events
- **Blood Pressure**: Modest reductions in systolic and diastolic pressure
- **Statin Support**: Prevents statin-induced CoQ10 depletion and associated muscle symptoms
- **Endothelial Function**: Improves vascular reactivity and nitric oxide production

## Antioxidant Properties

Ubiquinol serves as a potent fat-soluble antioxidant, protecting cell membranes and LDL cholesterol from oxidative damage. It regenerates other antioxidants including vitamin E.

## Age-Related Decline

Endogenous CoQ10 production decreases significantly after age 40. Supplementation becomes increasingly important for maintaining cellular energy and antioxidant capacity.

**Dosage**: 100-200mg ubiquinol daily, preferably with fat-containing meal. Higher doses (300-600mg) for statin users or cardiovascular support.',
  'https://example.com/coq10?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/17645676',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 9: B-Complex
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Active B-Complex',
  'Supports energy metabolism, enhances cognitive function, promotes nervous system health, and aids in stress management',
  'active-b-complex',
  '00000000-0000-0000-0000-000000000000',
  '# Active B-Complex: Bioavailable B Vitamins

This comprehensive B-vitamin complex utilizes activated, methylated forms that bypass genetic polymorphisms affecting B-vitamin metabolism. MTHFR and other genetic variants can significantly impair conversion of synthetic B-vitamins to active forms.

## Key Active Forms

- **Methylfolate (5-MTHF)**: Active form of folic acid, bypasses MTHFR mutations
- **Methylcobalamin**: Active B12 form, directly usable without conversion
- **P-5-P (Pyridoxal-5-Phosphate)**: Active B6, essential for neurotransmitter synthesis
- **Riboflavin-5-Phosphate**: Active B2, required for energy production

## Metabolic Functions

B-vitamins serve as essential cofactors in:
- **Energy Production**: TCA cycle and electron transport chain
- **DNA Synthesis**: Folate and B12 critical for cell division
- **Neurotransmitter Synthesis**: Serotonin, dopamine, GABA production
- **Homocysteine Metabolism**: Prevents accumulation of toxic amino acid
- **Red Blood Cell Formation**: Prevents megaloblastic anemia

## Genetic Considerations

Up to 40% of the population carries MTHFR variants that impair folic acid conversion. Active forms ensure adequate folate status regardless of genetic background.

**Dosage**: 1 capsule daily with food. Higher doses may be needed for specific deficiencies or genetic variants.',
  'https://example.com/b-complex?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/15585708',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 10: NAC (N-Acetyl Cysteine)
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'N-Acetyl Cysteine (NAC)',
  'Supports glutathione production, enhances liver detoxification, improves respiratory health, and provides antioxidant protection',
  'n-acetyl-cysteine-nac',
  '00000000-0000-0000-0000-000000000000',
  '# N-Acetyl Cysteine: The Glutathione Precursor

NAC serves as a direct precursor to glutathione, the body''s master antioxidant. Unlike oral glutathione, which is poorly absorbed, NAC effectively raises intracellular glutathione levels through de novo synthesis.

## Glutathione Synthesis

Glutathione (GSH) requires three amino acids: glutamate, cysteine, and glycine. Cysteine is typically the rate-limiting factor, making NAC supplementation highly effective for boosting GSH production.

## Liver Support

- **Acetaminophen Overdose**: FDA-approved treatment, prevents liver failure
- **Non-Alcoholic Fatty Liver**: Reduces liver enzymes and improves histology
- **Alcohol Metabolism**: Enhances acetaldehyde clearance
- **Toxin Clearance**: Supports Phase II detoxification pathways

## Respiratory Benefits

NAC''s mucolytic properties make it valuable for:
- Chronic obstructive pulmonary disease (COPD)
- Cystic fibrosis
- Chronic bronchitis
- Post-viral respiratory recovery

## Mental Health Applications

Emerging research suggests NAC benefits:
- Obsessive-compulsive disorder (OCD)
- Trichotillomania and skin-picking
- Bipolar disorder (mood stabilization)
- Addiction recovery support

**Dosage**: 600-1200mg daily, divided doses. Take on empty stomach or 30 minutes before meals for optimal absorption.',
  'https://example.com/nac?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/25722144',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 11: Quercetin
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Quercetin with Bromelain',
  'Reduces inflammation, supports immune function, provides antioxidant protection, and enhances exercise recovery',
  'quercetin-with-bromelain',
  '00000000-0000-0000-0000-000000000000',
  '# Quercetin: The Flavonoid Powerhouse

Quercetin, a plant flavonoid found in apples, onions, and capers, demonstrates potent anti-inflammatory and antioxidant properties. This formulation includes bromelain (pineapple enzyme) to enhance quercetin absorption and provide additional anti-inflammatory benefits.

## Anti-Inflammatory Mechanisms

- **Mast Cell Stabilization**: Prevents histamine release and allergic responses
- **COX-2 Inhibition**: Reduces production of inflammatory prostaglandins
- **NF-κB Suppression**: Modulates key inflammatory transcription factor
- **Cytokine Regulation**: Lowers production of TNF-α and IL-6

## Immune System Support

Quercetin exhibits antiviral properties through:
- **Viral Entry Inhibition**: Blocks viral attachment to host cells
- **Replication Interference**: Disrupts viral RNA synthesis
- **Immune Cell Modulation**: Enhances natural killer cell activity

## Exercise Performance

- **Mitochondrial Biogenesis**: Promotes new mitochondria formation
- **Endurance Enhancement**: Improves time to exhaustion
- **Recovery Acceleration**: Reduces post-exercise inflammation
- **VO2 Max Improvement**: Enhances oxygen utilization efficiency

## Bromelain Synergy

Bromelain, a proteolytic enzyme from pineapple, enhances quercetin absorption while providing independent anti-inflammatory and digestive benefits.

**Dosage**: 500-1000mg quercetin with 100-200mg bromelain, 1-2 times daily. Take on empty stomach for optimal absorption.',
  'https://example.com/quercetin?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/26957296',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 12: Melatonin
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Extended-Release Melatonin',
  'Improves sleep quality, regulates circadian rhythm, reduces jet lag symptoms, and supports healthy sleep-wake cycles',
  'extended-release-melatonin',
  '00000000-0000-0000-0000-000000000000',
  '# Melatonin: The Sleep Hormone

Melatonin, produced by the pineal gland, serves as the primary regulator of circadian rhythms and sleep-wake cycles. This extended-release formulation mimics natural melatonin secretion patterns, providing sustained sleep support throughout the night.

## Circadian Rhythm Regulation

Melatonin binds to MT1 and MT2 receptors in the suprachiasmatic nucleus, synchronizing the body''s internal clock with external light-dark cycles. Supplementation helps reset circadian rhythms disrupted by:
- Shift work
- Jet lag
- Delayed sleep phase disorder
- Age-related melatonin decline

## Sleep Architecture

- **Sleep Onset**: Reduces time to fall asleep by 3-7 minutes
- **Sleep Duration**: Increases total sleep time
- **REM Sleep**: Enhances REM sleep duration and quality
- **Sleep Efficiency**: Improves percentage of time asleep while in bed

## Extended-Release Technology

Unlike immediate-release melatonin, this formulation provides sustained release over 6-8 hours, matching natural melatonin secretion patterns. This prevents early-morning awakenings and supports deeper, more restorative sleep.

## Additional Benefits

- **Antioxidant Activity**: Direct free radical scavenging
- **Immune Modulation**: Enhances natural killer cell activity
- **Migraine Prevention**: Reduces frequency and severity
- **Gastrointestinal Protection**: Supports gut barrier function

**Dosage**: 0.5-3mg extended-release, 30-60 minutes before desired sleep time. Start with lowest effective dose.',
  'https://example.com/melatonin?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23853635',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 13: Rhodiola Rosea
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Rhodiola Rosea Extract',
  'Enhances mental performance, reduces fatigue, improves stress resilience, and supports physical endurance',
  'rhodiola-rosea-extract',
  '00000000-0000-0000-0000-000000000000',
  '# Rhodiola Rosea: The Arctic Adaptogen

Rhodiola rosea, native to arctic and alpine regions, has been used for centuries to enhance physical and mental performance under stress. This extract is standardized to 3% rosavins and 1% salidroside, the primary bioactive compounds.

## Adaptogenic Properties

Rhodiola functions as a true adaptogen, helping the body maintain homeostasis during physical and psychological stress. Unlike stimulants, it enhances performance without depleting energy reserves.

## Cognitive Enhancement

- **Mental Fatigue Reduction**: Improves attention, memory, and information processing
- **Work Performance**: Enhances accuracy and speed in demanding tasks
- **Mood Elevation**: Reduces symptoms of depression and anxiety
- **Neuroprotection**: Protects against stress-induced neuronal damage

## Physical Performance

- **Endurance Enhancement**: Increases time to exhaustion
- **Recovery Acceleration**: Reduces perceived exertion and recovery time
- **Altitude Adaptation**: Improves performance at high altitudes
- **Oxygen Utilization**: Enhances VO2 max and respiratory efficiency

## Mechanism of Action

- **HPA Axis Modulation**: Normalizes cortisol response to stress
- **Neurotransmitter Support**: Enhances serotonin, dopamine, and norepinephrine
- **ATP Production**: Improves mitochondrial energy generation
- **Antioxidant Activity**: Reduces oxidative stress from physical exertion

**Dosage**: 200-400mg standardized extract (3% rosavins, 1% salidroside) daily, preferably in the morning. Avoid evening use as it may interfere with sleep.',
  'https://example.com/rhodiola?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/19016404',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80', 'https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 14: Alpha-Lipoic Acid
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'R-Alpha-Lipoic Acid',
  'Supports blood sugar regulation, provides antioxidant protection, enhances nerve health, and supports healthy aging',
  'r-alpha-lipoic-acid',
  '00000000-0000-0000-0000-000000000000',
  '# R-Alpha-Lipoic Acid: The Universal Antioxidant

Alpha-lipoic acid (ALA) stands unique among antioxidants, functioning in both water and fat-soluble environments. The R-form represents the natural, biologically active enantiomer, providing superior efficacy compared to racemic mixtures.

## Antioxidant Properties

- **Universal Solubility**: Works in both aqueous and lipid environments
- **Antioxidant Regeneration**: Recycles vitamin C, vitamin E, and glutathione
- **Metal Chelation**: Binds and removes toxic metals (iron, copper, mercury)
- **Free Radical Scavenging**: Directly neutralizes reactive oxygen species

## Blood Sugar Support

ALA enhances glucose uptake into cells through:
- **GLUT4 Translocation**: Moves glucose transporters to cell membrane
- **Insulin Sensitivity**: Improves insulin receptor signaling
- **Glycation Prevention**: Reduces formation of advanced glycation end products (AGEs)
- **Diabetic Neuropathy**: Reduces pain and improves nerve function

## Neuroprotective Effects

- **Mitochondrial Support**: Enhances energy production in neurons
- **Nerve Regeneration**: Promotes peripheral nerve repair
- **Cognitive Function**: Improves memory and learning in age-related decline
- **Stroke Recovery**: Reduces brain damage and improves outcomes

## Bioavailability

R-ALA achieves 40-50% higher plasma levels compared to racemic ALA. This formulation uses sodium-R-lipoate for enhanced stability and absorption.

**Dosage**: 300-600mg R-ALA daily, divided doses. Take on empty stomach for optimal absorption.',
  'https://example.com/ala?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/18390739',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80']::TEXT[],
  true, false, true, true
);

-- Product 15: Resveratrol
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Trans-Resveratrol',
  'Supports cardiovascular health, provides antioxidant protection, promotes healthy aging, and enhances cellular function',
  'trans-resveratrol',
  '00000000-0000-0000-0000-000000000000',
  '# Resveratrol: The Longevity Molecule

Resveratrol, found in red wine, grapes, and Japanese knotweed, has gained attention for its potential longevity and cardiovascular benefits. The trans-isomer represents the biologically active form, requiring careful extraction and storage to maintain stability.

## Sirtuin Activation

Resveratrol activates SIRT1, a class of proteins linked to longevity and metabolic health. Sirtuins regulate:
- **DNA Repair**: Enhances cellular repair mechanisms
- **Gene Expression**: Modulates genes involved in aging
- **Metabolic Function**: Improves insulin sensitivity and glucose metabolism
- **Mitochondrial Biogenesis**: Promotes new mitochondria formation

## Cardiovascular Benefits

- **Endothelial Function**: Improves nitric oxide production and vasodilation
- **Cholesterol Management**: Modulates LDL oxidation and clearance
- **Blood Pressure**: Modest reductions in systolic pressure
- **Platelet Function**: Reduces excessive platelet aggregation

## Anti-Aging Mechanisms

- **Telomere Protection**: May slow telomere shortening
- **Cellular Senescence**: Reduces accumulation of senescent cells
- **Inflammation Reduction**: Lowers age-related inflammatory markers
- **Cognitive Protection**: Supports brain health and memory

## Bioavailability Enhancement

Resveratrol suffers from poor oral bioavailability. This formulation includes piperine to enhance absorption and utilizes micronized particles for improved dissolution.

**Dosage**: 250-500mg trans-resveratrol daily, with fat-containing meal. Higher doses (1-2g) for therapeutic applications.',
  'https://example.com/resveratrol?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/17569207',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 16: Spirulina
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Organic Spirulina Powder',
  'Provides complete protein, supports immune function, enhances energy levels, and delivers essential nutrients',
  'organic-spirulina-powder',
  '00000000-0000-0000-0000-000000000000',
  '# Spirulina: The Complete Superfood

Spirulina, a blue-green algae, represents one of nature''s most nutrient-dense foods. This organic, non-GMO spirulina provides complete protein, essential fatty acids, vitamins, and minerals in highly bioavailable forms.

## Nutritional Profile

- **Complete Protein**: 60-70% protein by weight, containing all essential amino acids
- **B-Vitamins**: Rich source of B1, B2, B3, B6, and B12 (bioavailable form)
- **Iron**: Highly absorbable iron, important for vegetarians
- **Beta-Carotene**: Precursor to vitamin A, with superior conversion rates
- **Gamma-Linolenic Acid**: Rare omega-6 fatty acid with anti-inflammatory properties

## Health Benefits

- **Immune Support**: Enhances natural killer cell activity and antibody production
- **Energy Enhancement**: Provides sustained energy without caffeine
- **Detoxification**: Binds to heavy metals and supports elimination
- **Cardiovascular Health**: Lowers LDL cholesterol and triglycerides
- **Allergy Relief**: Reduces histamine release and allergic symptoms

## Quality Standards

This organic spirulina is:
- **Third-Party Tested**: Verified free of microcystins and contaminants
- **Low Temperature Dried**: Preserves heat-sensitive nutrients
- **Non-GMO Verified**: Certified organic and non-GMO
- **Heavy Metal Tested**: Below detectable limits for lead, mercury, cadmium

**Dosage**: 1-3 teaspoons (3-9g) daily, mixed in smoothies, water, or juice. Start with lower dose and increase gradually.',
  'https://example.com/spirulina?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23754631',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80', 'https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 17: Chlorella
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Broken Cell Wall Chlorella',
  'Supports detoxification, enhances immune function, provides complete nutrition, and promotes digestive health',
  'broken-cell-wall-chlorella',
  '00000000-0000-0000-0000-000000000000',
  '# Chlorella: The Detoxification Powerhouse

Chlorella, a single-celled green algae, offers exceptional nutritional density and unique detoxification properties. This broken-cell-wall formulation ensures maximum nutrient bioavailability, as chlorella''s rigid cell wall would otherwise prevent nutrient absorption.

## Detoxification Properties

- **Heavy Metal Binding**: Chlorella Growth Factor (CGF) binds to lead, mercury, and cadmium
- **Chlorophyll Content**: Highest chlorophyll concentration of any food, supports liver detoxification
- **Fiber Content**: Insoluble fiber binds to toxins in the digestive tract
- **Antioxidant Support**: Rich in beta-carotene and other antioxidants

## Nutritional Benefits

- **Complete Protein**: All essential amino acids in optimal ratios
- **B12 Content**: Bioavailable B12, critical for vegetarians
- **Iron**: Highly absorbable plant-based iron
- **Nucleic Acids**: RNA and DNA content supports cellular repair
- **Chlorella Growth Factor**: Unique compound supporting growth and repair

## Immune Enhancement

- **Natural Killer Cells**: Increases NK cell activity
- **Interferon Production**: Enhances antiviral immune responses
- **Antibody Production**: Supports B-cell function and antibody synthesis
- **Macrophage Activity**: Enhances pathogen clearance

## Digestive Health

- **Prebiotic Effects**: Supports beneficial gut bacteria
- **Digestive Enzymes**: Contains natural enzymes aiding digestion
- **Bowel Regularity**: Fiber content promotes healthy elimination
- **Gut Barrier Support**: Maintains intestinal integrity

**Dosage**: 2-5g (4-10 tablets) daily, with meals. Start with lower dose and increase gradually to allow digestive system adaptation.',
  'https://example.com/chlorella?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/22280495',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80', 'https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 18: Lion's Mane
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Lion''s Mane Mushroom Extract',
  'Enhances cognitive function, supports nerve regeneration, improves memory, and promotes neuroplasticity',
  'lions-mane-mushroom-extract',
  '00000000-0000-0000-0000-000000000000',
  '# Lion''s Mane: The Cognitive Mushroom

Lion''s Mane (Hericium erinaceus) stands as one of the most researched medicinal mushrooms for cognitive and neurological health. This dual-extract (water and alcohol) ensures extraction of both water-soluble and alcohol-soluble bioactive compounds.

## Neurotrophic Factors

Lion''s Mane stimulates production of nerve growth factor (NGF) and brain-derived neurotrophic factor (BDNF), proteins critical for:
- **Neurogenesis**: Formation of new neurons
- **Synaptic Plasticity**: Strengthening of neural connections
- **Nerve Regeneration**: Repair of damaged nerve cells
- **Myelin Formation**: Protection and insulation of nerve fibers

## Cognitive Benefits

- **Memory Enhancement**: Improves both short-term and long-term memory
- **Focus and Concentration**: Enhances attention and mental clarity
- **Processing Speed**: Accelerates information processing
- **Mental Fatigue Reduction**: Reduces cognitive exhaustion

## Neuroprotective Effects

- **Alzheimer''s Support**: May slow progression and improve symptoms
- **Parkinson''s Support**: Protects dopaminergic neurons
- **Stroke Recovery**: Enhances recovery and reduces damage
- **Peripheral Neuropathy**: Supports nerve regeneration

## Mood and Mental Health

- **Anxiety Reduction**: Modulates GABA and serotonin systems
- **Depression Support**: Enhances neuroplasticity and mood
- **Sleep Quality**: Improves sleep architecture
- **Stress Resilience**: Adaptogenic properties support stress response

## Extraction Method

Dual-extraction (hot water + alcohol) ensures comprehensive extraction of:
- **Beta-glucans**: Immune-modulating polysaccharides
- **Hericenones**: Stimulate NGF production
- **Erinacines**: Cross blood-brain barrier, enhance NGF in brain

**Dosage**: 500-1500mg dual-extract daily, standardized to 30% polysaccharides. Effects typically manifest within 2-4 weeks.',
  'https://example.com/lions-mane?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/24266378',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80', 'https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 19: Reishi
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Reishi Mushroom Extract',
  'Supports immune function, promotes relaxation, enhances sleep quality, and provides adaptogenic stress support',
  'reishi-mushroom-extract',
  '00000000-0000-0000-0000-000000000000',
  '# Reishi: The Mushroom of Immortality

Reishi (Ganoderma lucidum), revered in Traditional Chinese Medicine as the "Mushroom of Immortality," offers comprehensive immune and nervous system support. This dual-extract provides both water-soluble beta-glucans and alcohol-soluble triterpenes.

## Immune System Modulation

Reishi exhibits unique immunomodulatory properties:
- **Natural Killer Cells**: Dramatically increases NK cell activity
- **Macrophage Activation**: Enhances pathogen clearance
- **Cytokine Balance**: Modulates inflammatory and anti-inflammatory cytokines
- **Antibody Production**: Supports B-cell function and antibody synthesis

## Nervous System Support

- **GABA Activity**: Enhances GABAergic neurotransmission, promoting relaxation
- **Sleep Quality**: Improves sleep onset, duration, and architecture
- **Stress Response**: Adaptogenic properties normalize HPA axis function
- **Cognitive Function**: Supports memory and mental clarity

## Cardiovascular Benefits

- **Blood Pressure**: Modest reductions in both systolic and diastolic pressure
- **Cholesterol Management**: Lowers LDL and total cholesterol
- **Platelet Function**: Reduces excessive aggregation
- **Endothelial Health**: Improves vascular function

## Triterpene Content

Reishi triterpenes (ganoderic acids) provide:
- **Anti-Inflammatory Effects**: Reduce chronic inflammation
- **Liver Protection**: Support liver function and regeneration
- **Allergy Relief**: Reduce histamine release and allergic responses
- **Antiviral Activity**: Inhibit viral replication

## Quality Standards

This extract is standardized to:
- **30% Polysaccharides**: Beta-glucans for immune support
- **6% Triterpenes**: Ganoderic acids for comprehensive benefits
- **Dual-Extracted**: Water and alcohol extraction for complete compound profile

**Dosage**: 1-3g dual-extract daily, preferably in the evening for sleep support. Higher doses (3-6g) for immune support during illness.',
  'https://example.com/reishi?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23557365',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80', 'https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- Product 20: Cordyceps
INSERT INTO protocols (
  id, title, problem_solved, slug, created_by, ai_summary, buy_url, reference_url,
  is_sme_certified, source_transparency, purity_tested, potency_verified, excipient_audit, operational_legitimacy, third_party_lab_verified,
  images, lab_tested, organic, purity_verified, third_party_coa
) VALUES (
  gen_random_uuid(),
  'Cordyceps Sinensis Extract',
  'Enhances athletic performance, supports respiratory health, boosts energy levels, and improves oxygen utilization',
  'cordyceps-sinensis-extract',
  '00000000-0000-0000-0000-000000000000',
  '# Cordyceps: The Athletic Performance Enhancer

Cordyceps sinensis, a parasitic fungus that grows on caterpillar larvae in the Himalayas, has been used for centuries to enhance physical performance and respiratory function. This extract provides standardized cordycepin and adenosine content.

## Athletic Performance

- **VO2 Max Enhancement**: Increases maximum oxygen consumption by 5-15%
- **Endurance Improvement**: Extends time to exhaustion
- **Recovery Acceleration**: Reduces muscle soreness and recovery time
- **ATP Production**: Enhances cellular energy generation
- **Lactate Clearance**: Improves removal of lactic acid during exercise

## Respiratory Benefits

- **Oxygen Utilization**: Improves oxygen uptake and delivery
- **Bronchial Function**: Supports healthy airway function
- **Altitude Adaptation**: Enhances performance at high altitudes
- **Respiratory Efficiency**: Improves breathing economy

## Energy and Vitality

- **Cellular Energy**: Increases ATP production in mitochondria
- **Fatigue Reduction**: Reduces perceived exertion
- **Stamina Enhancement**: Improves sustained energy levels
- **Metabolic Efficiency**: Optimizes energy substrate utilization

## Immune Support

- **Natural Killer Cells**: Enhances NK cell activity
- **Macrophage Function**: Improves pathogen clearance
- **Antioxidant Activity**: Reduces exercise-induced oxidative stress
- **Inflammation Modulation**: Balances inflammatory responses

## Active Compounds

- **Cordycepin**: Unique nucleoside with antiviral and energy-enhancing properties
- **Adenosine**: Precursor to ATP, supports energy production
- **Beta-Glucans**: Immune-modulating polysaccharides
- **Mannitol**: Supports kidney function and fluid balance

**Dosage**: 1-3g extract daily, standardized to 1% cordycepin. Take 30-60 minutes before exercise for performance benefits, or with meals for general health support.',
  'https://example.com/cordyceps?ref=SME',
  'https://pubmed.ncbi.nlm.nih.gov/23261430',
  true, true, true, true, true, true,
  ARRAY['https://images.unsplash.com/photo-1606787842090-a6f7c3a3d327?w=800&q=80', 'https://images.unsplash.com/photo-1615485925511-ef4e4c5b0c5a?w=800&q=80']::TEXT[],
  true, true, true, true
);

-- =====================================================
-- COMPLETE
-- =====================================================
-- 20 holistic products seeded with:
-- - Realistic titles and descriptions
-- - Comprehensive AI summaries (Expert Notebook content)
-- - All 5-pillar certification fields set to true
-- - Beautiful placeholder images from Unsplash
-- - Proper buy URLs with ?ref=SME
-- - Reference URLs to PubMed studies
-- =====================================================
-- Note: Images use Unsplash placeholder URLs
-- Replace with actual product images after running
-- =====================================================




