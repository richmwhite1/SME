-- Production Seed Data
-- Extracted from app/api/production-seed/route.ts

BEGIN;

-- 1. SEED PROFILES
INSERT INTO profiles (id, full_name, username, email, avatar_url, bio, contributor_score, badge_type, created_at)
VALUES 
('user_2pQrXxYzAbCdEfGhIjKlMnOp', 'Dr. Sarah Chen', 'dr_sarah_chen', 'sarah@example.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Longevity researcher and biohacking enthusiast', 450, 'Trusted Voice', NOW()),
('user_3qRsYyZaAbCdEfGhIjKlMnOp', 'Marcus Thompson', 'marcus_biohacker', 'marcus@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Performance optimization and metabolic health', 320, 'Contributor', NOW()),
('user_4tUvZzAaBbCdEfGhIjKlMnOp', 'Elena Rodriguez', 'elena_wellness', 'elena@example.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Gut health specialist and nutrition coach', 275, 'Contributor', NOW()),
('user_5wXyAaBbCcDdEfGhIjKlMnOp', 'James Park', 'james_optimized', 'james@example.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Sleep optimization and circadian rhythm expert', 180, 'Member', NOW()),
('user_6yZaBbCcDdEeFfGhIjKlMnOp', 'Olivia Martinez', 'olivia_clinical', 'olivia@example.com', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400', 'Clinical researcher focused on supplement efficacy', 390, 'Trusted Voice', NOW())
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    contributor_score = EXCLUDED.contributor_score,
    badge_type = EXCLUDED.badge_type;

-- 2. SEED PRODUCTS
INSERT INTO products (
    title, slug, problem_solved, ai_summary, buy_url, images,
    is_sme_certified, third_party_lab_verified, purity_tested,
    source_transparency, potency_verified, excipient_audit,
    operational_legitimacy, created_at
) VALUES 
(
    'Forest Magnesium Glycinate',
    'forest-magnesium-glycinate',
    'Deep sleep restoration and nervous system regulation',
    'Clinical-grade magnesium chelated with glycine for superior bioavailability. Supports GABA production and parasympathetic activation.',
    'https://example.com/forest-magnesium',
    ARRAY['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Obsidian Omega-3 Complex',
    'obsidian-omega-3-complex',
    'Cardiovascular optimization and systemic inflammation reduction',
    'Molecularly distilled fish oil with 2:1 EPA:DHA ratio. Third-party tested for heavy metals and oxidation markers.',
    'https://example.com/obsidian-omega3',
    ARRAY['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Apothecary Ashwagandha KSM-66',
    'apothecary-ashwagandha-ksm66',
    'HPA-axis regulation and cortisol normalization',
    'Full-spectrum root extract standardized to 5% withanolides. Clinically validated for stress resilience and hormonal balance.',
    'https://example.com/apothecary-ashwagandha',
    ARRAY['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800'],
    true, true, true, true, false, true, true, NOW()
),
(
    'Clinical Vitamin D3 + K2 MK-7',
    'clinical-vitamin-d3-k2-mk7',
    'Bone density optimization and immune system modulation',
    'Synergistic pairing of cholecalciferol with menaquinone-7 for optimal calcium metabolism and arterial health.',
    'https://example.com/clinical-d3k2',
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Forest Creatine Monohydrate',
    'forest-creatine-monohydrate',
    'ATP regeneration and cognitive performance enhancement',
    'Micronized creatine monohydrate with 99.9% purity. Supports cellular energy production and neuroprotection.',
    'https://example.com/forest-creatine',
    ARRAY['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Obsidian NAD+ Precursor Complex',
    'obsidian-nad-precursor-complex',
    'Cellular energy metabolism and mitochondrial function',
    'Pharmaceutical-grade NMN with enhanced bioavailability. Supports NAD+ synthesis for longevity pathways.',
    'https://example.com/obsidian-nad',
    ARRAY['https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800'],
    true, true, true, true, true, false, true, NOW()
),
(
    'Apothecary L-Theanine',
    'apothecary-l-theanine',
    'Alpha wave enhancement and focused relaxation',
    'Suntheanine® brand L-theanine for clean mental clarity without sedation. Synergizes with caffeine for optimal cognition.',
    'https://example.com/apothecary-theanine',
    ARRAY['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Clinical Curcumin Phytosome',
    'clinical-curcumin-phytosome',
    'Systemic inflammation modulation and joint health',
    'Meriva® curcumin with phosphatidylcholine for 29x improved absorption. Clinically studied for inflammatory markers.',
    'https://example.com/clinical-curcumin',
    ARRAY['https://images.unsplash.com/photo-1615485500834-bc10199bc727?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Forest Rhodiola Rosea Extract',
    'forest-rhodiola-rosea-extract',
    'Mental fatigue resistance and adaptogenic support',
    'Standardized to 3% rosavins and 1% salidroside. Supports cognitive endurance during prolonged stress.',
    'https://example.com/forest-rhodiola',
    ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800'],
    false, true, true, true, true, true, true, NOW()
),
(
    'Obsidian Zinc Bisglycinate',
    'obsidian-zinc-bisglycinate',
    'Immune function and testosterone optimization',
    'Chelated zinc for superior absorption without gastric distress. Essential cofactor for 300+ enzymatic reactions.',
    'https://example.com/obsidian-zinc',
    ARRAY['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Apothecary Berberine HCl',
    'apothecary-berberine-hcl',
    'Glucose metabolism and gut microbiome modulation',
    'Pharmaceutical-grade berberine for metabolic health. Activates AMPK pathway similar to metformin.',
    'https://example.com/apothecary-berberine',
    ARRAY['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Clinical CoQ10 Ubiquinol',
    'clinical-coq10-ubiquinol',
    'Mitochondrial energy production and cardiovascular support',
    'Reduced form of CoQ10 for immediate bioavailability. Critical for cellular ATP synthesis and antioxidant defense.',
    'https://example.com/clinical-coq10',
    ARRAY['https://images.unsplash.com/photo-1550572017-4814c6f5a5e6?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Forest Lion''s Mane Mushroom',
    'forest-lions-mane-mushroom',
    'Neurogenesis and cognitive longevity',
    'Dual-extracted fruiting body with hericenones and erinacines. Supports NGF production for brain health.',
    'https://example.com/forest-lionsmane',
    ARRAY['https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=800'],
    true, true, true, true, false, true, true, NOW()
),
(
    'Obsidian Glycine Powder',
    'obsidian-glycine-powder',
    'Collagen synthesis and sleep architecture optimization',
    'Pure glycine amino acid for deep sleep enhancement and connective tissue support. Lowers core body temperature.',
    'https://example.com/obsidian-glycine',
    ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Apothecary Spirulina Tablets',
    'apothecary-spirulina-tablets',
    'Micronutrient density and detoxification support',
    'Organic spirulina with complete amino acid profile. Rich in phycocyanin for antioxidant and anti-inflammatory effects.',
    'https://example.com/apothecary-spirulina',
    ARRAY['https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800'],
    false, true, true, true, true, true, true, NOW()
),
(
    'Clinical Methylfolate + B12',
    'clinical-methylfolate-b12',
    'Methylation pathway optimization and homocysteine regulation',
    'Bioactive B-vitamins bypassing MTHFR mutations. Essential for neurotransmitter synthesis and DNA repair.',
    'https://example.com/clinical-methylfolate',
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Forest Taurine',
    'forest-taurine',
    'Electrolyte balance and cardiovascular function',
    'Conditionally essential amino acid for heart rhythm regulation and bile salt formation. Supports healthy aging.',
    'https://example.com/forest-taurine',
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Obsidian Phosphatidylserine',
    'obsidian-phosphatidylserine',
    'Cortisol regulation and cognitive performance under stress',
    'Soy-free phosphatidylserine for cell membrane integrity. Clinically shown to blunt exercise-induced cortisol spike.',
    'https://example.com/obsidian-ps',
    ARRAY['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800'],
    true, true, true, true, true, true, true, NOW()
),
(
    'Apothecary Bacopa Monnieri',
    'apothecary-bacopa-monnieri',
    'Memory consolidation and learning enhancement',
    'Standardized to 50% bacosides for nootropic effects. Traditional Ayurvedic herb with modern clinical validation.',
    'https://example.com/apothecary-bacopa',
    ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800'],
    false, true, true, true, true, true, true, NOW()
),
(
    'Clinical Electrolyte Complex',
    'clinical-electrolyte-complex',
    'Hydration optimization and mineral repletion',
    'Balanced sodium, potassium, and magnesium for cellular hydration. Zero sugar formulation for metabolic health.',
    'https://example.com/clinical-electrolytes',
    ARRAY['https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800'],
    true, true, true, true, true, true, true, NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    problem_solved = EXCLUDED.problem_solved,
    ai_summary = EXCLUDED.ai_summary,
    buy_url = EXCLUDED.buy_url,
    images = EXCLUDED.images,
    is_sme_certified = EXCLUDED.is_sme_certified,
    third_party_lab_verified = EXCLUDED.third_party_lab_verified,
    purity_tested = EXCLUDED.purity_tested,
    source_transparency = EXCLUDED.source_transparency,
    potency_verified = EXCLUDED.potency_verified,
    excipient_audit = EXCLUDED.excipient_audit,
    operational_legitimacy = EXCLUDED.operational_legitimacy;

COMMIT;
