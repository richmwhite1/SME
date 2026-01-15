import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * ONE-TIME PRODUCTION SEED ROUTE (Robust Manual Version)
 */
export async function GET() {
    const sql = getDb();
    const logs: string[] = [];

    try {
        // 0. AUTO-FIX SCHEMA ISSUES
        try {
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id TEXT`; // Add user_id column
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contributor_score INTEGER DEFAULT 0`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_type TEXT DEFAULT 'Member'`;
            await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`;

            await sql`ALTER TABLE discussions ADD COLUMN IF NOT EXISTS author_id TEXT`;
            await sql`ALTER TABLE discussions ADD COLUMN IF NOT EXISTS tags TEXT[]`;
            await sql`ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false`;

            // Try to add constraints but ignore failures
            try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS discussions_slug_idx ON discussions (slug)`; } catch { }
            try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products (slug)`; } catch { }
        } catch (e) {
            logs.push(`Schema fix partial failure: ${e}`);
        }

        // Ensure products table exists
        await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        problem_solved TEXT,
        ai_summary TEXT,
        buy_url TEXT,
        images TEXT[],
        is_sme_certified BOOLEAN DEFAULT false,
        third_party_lab_verified BOOLEAN DEFAULT false,
        purity_tested BOOLEAN DEFAULT false,
        source_transparency BOOLEAN DEFAULT false,
        potency_verified BOOLEAN DEFAULT false,
        excipient_audit BOOLEAN DEFAULT false,
        operational_legitimacy BOOLEAN DEFAULT false,
        is_flagged BOOLEAN DEFAULT false,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // Ensure reviews table exists (required for product page queries)
        await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID, 
        user_id TEXT,
        rating INTEGER,
        content TEXT,
        is_flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // Ensure product_comments table exists (required for home page queries)
        await sql`
      CREATE TABLE IF NOT EXISTS product_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID,
        user_id TEXT,
        content TEXT,
        is_flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // Handle legacy schema where product_id might be missing or named protocol_id
        // We try to add product_id if not exists. If protocol_id exists, we might need to rely on the separate migration script, 
        // but for seeding purposes, we just need the column to be present for the JOINs to validly return 0 rows instead of error.
        try { await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id UUID`; } catch { }
        try { await sql`ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS product_id UUID`; } catch { }


        // Execute all seed operations sequentially (without transaction wrapper to avoid TypeScript errors)

        // ==========================================
        // 1. SEED PROFILES (USERS) - Manual Check
        // ==========================================

        const testProfiles = [
            {
                id: 'user_2pQrXxYzAbCdEfGhIjKlMnOp',
                full_name: 'Dr. Sarah Chen',
                username: 'dr_sarah_chen',
                email: 'sarah@example.com',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
                bio: 'Longevity researcher and biohacking enthusiast',
                contributor_score: 450,
                badge_type: 'Trusted Voice'
            },
            {
                id: 'user_3qRsYyZaAbCdEfGhIjKlMnOp',
                full_name: 'Marcus Thompson',
                username: 'marcus_biohacker',
                email: 'marcus@example.com',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                bio: 'Performance optimization and metabolic health',
                contributor_score: 320,
                badge_type: 'Contributor'
            },
            // ... (truncated list for brevity, keeping all 5 is fine)
            {
                id: 'user_4tUvZzAaBbCdEfGhIjKlMnOp',
                full_name: 'Elena Rodriguez',
                username: 'elena_wellness',
                email: 'elena@example.com',
                avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
                bio: 'Gut health specialist and nutrition coach',
                contributor_score: 275,
                badge_type: 'Contributor'
            },
            {
                id: 'user_5wXyAaBbCcDdEfGhIjKlMnOp',
                full_name: 'James Park',
                username: 'james_optimized',
                email: 'james@example.com',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
                bio: 'Sleep optimization and circadian rhythm expert',
                contributor_score: 180,
                badge_type: 'Member'
            },
            {
                id: 'user_6yZaBbCcDdEeFfGhIjKlMnOp',
                full_name: 'Olivia Martinez',
                username: 'olivia_clinical',
                email: 'olivia@example.com',
                avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
                bio: 'Clinical researcher focused on supplement efficacy',
                contributor_score: 390,
                badge_type: 'Trusted Voice'
            }
        ];

        for (const profile of testProfiles) {
            // Check if exists
            const existing = await sql`SELECT id FROM profiles WHERE id = ${profile.id}`;

            if (existing.length > 0) {
                // Update
                await sql`
                UPDATE profiles 
                SET user_id = ${profile.id},
                    full_name = ${profile.full_name},
                    username = ${profile.username},
                    avatar_url = ${profile.avatar_url},
                    bio = ${profile.bio},
                    contributor_score = ${profile.contributor_score},
                    badge_type = ${profile.badge_type}
                WHERE id = ${profile.id}
            `;
            } else {
                // Insert
                await sql`
              INSERT INTO profiles (id, user_id, full_name, username, email, avatar_url, bio, contributor_score, badge_type, created_at)
              VALUES (
                ${profile.id},
                ${profile.id},
                ${profile.full_name},
                ${profile.username},
                ${profile.email},
                ${profile.avatar_url},
                ${profile.bio},
                ${profile.contributor_score},
                ${profile.badge_type},
                NOW()
              )
            `;
            }
        }

        // ==========================================
        // 2. SEED 20 PREMIUM HEALTH PRODUCTS
        // ==========================================

        const products = [
            {
                title: 'Forest Magnesium Glycinate',
                slug: 'forest-magnesium-glycinate',
                problem_solved: 'Deep sleep restoration and nervous system regulation',
                ai_summary: 'Clinical-grade magnesium chelated with glycine for superior bioavailability. Supports GABA production and parasympathetic activation.',
                buy_url: 'https://example.com/forest-magnesium',
                images: ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Obsidian Omega-3 Complex',
                slug: 'obsidian-omega-3-complex',
                problem_solved: 'Cardiovascular optimization and systemic inflammation reduction',
                ai_summary: 'Molecularly distilled fish oil with 2:1 EPA:DHA ratio. Third-party tested for heavy metals and oxidation markers.',
                buy_url: 'https://example.com/obsidian-omega3',
                images: ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            // ... (Repeating list from previous attempts)
            {
                title: 'Apothecary Ashwagandha KSM-66',
                slug: 'apothecary-ashwagandha-ksm66',
                problem_solved: 'HPA-axis regulation and cortisol normalization',
                ai_summary: 'Full-spectrum root extract standardized to 5% withanolides. Clinically validated for stress resilience and hormonal balance.',
                buy_url: 'https://example.com/apothecary-ashwagandha',
                images: ['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: false,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Clinical Vitamin D3 + K2 MK-7',
                slug: 'clinical-vitamin-d3-k2-mk7',
                problem_solved: 'Bone density optimization and immune system modulation',
                ai_summary: 'Synergistic pairing of cholecalciferol with menaquinone-7 for optimal calcium metabolism and arterial health.',
                buy_url: 'https://example.com/clinical-d3k2',
                images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Forest Creatine Monohydrate',
                slug: 'forest-creatine-monohydrate',
                problem_solved: 'ATP regeneration and cognitive performance enhancement',
                ai_summary: 'Micronized creatine monohydrate with 99.9% purity. Supports cellular energy production and neuroprotection.',
                buy_url: 'https://example.com/forest-creatine',
                images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Obsidian NAD+ Precursor Complex',
                slug: 'obsidian-nad-precursor-complex',
                problem_solved: 'Cellular energy metabolism and mitochondrial function',
                ai_summary: 'Pharmaceutical-grade NMN with enhanced bioavailability. Supports NAD+ synthesis for longevity pathways.',
                buy_url: 'https://example.com/obsidian-nad',
                images: ['https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: false,
                operational_legitimacy: true
            },
            {
                title: 'Apothecary L-Theanine',
                slug: 'apothecary-l-theanine',
                problem_solved: 'Alpha wave enhancement and focused relaxation',
                ai_summary: 'Suntheanine® brand L-theanine for clean mental clarity without sedation. Synergizes with caffeine for optimal cognition.',
                buy_url: 'https://example.com/apothecary-theanine',
                images: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Clinical Curcumin Phytosome',
                slug: 'clinical-curcumin-phytosome',
                problem_solved: 'Systemic inflammation modulation and joint health',
                ai_summary: 'Meriva® curcumin with phosphatidylcholine for 29x improved absorption. Clinically studied for inflammatory markers.',
                buy_url: 'https://example.com/clinical-curcumin',
                images: ['https://images.unsplash.com/photo-1615485500834-bc10199bc727?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Forest Rhodiola Rosea Extract',
                slug: 'forest-rhodiola-rosea-extract',
                problem_solved: 'Mental fatigue resistance and adaptogenic support',
                ai_summary: 'Standardized to 3% rosavins and 1% salidroside. Supports cognitive endurance during prolonged stress.',
                buy_url: 'https://example.com/forest-rhodiola',
                images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800'],
                is_sme_certified: false,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Obsidian Zinc Bisglycinate',
                slug: 'obsidian-zinc-bisglycinate',
                problem_solved: 'Immune function and testosterone optimization',
                ai_summary: 'Chelated zinc for superior absorption without gastric distress. Essential cofactor for 300+ enzymatic reactions.',
                buy_url: 'https://example.com/obsidian-zinc',
                images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Apothecary Berberine HCl',
                slug: 'apothecary-berberine-hcl',
                problem_solved: 'Glucose metabolism and gut microbiome modulation',
                ai_summary: 'Pharmaceutical-grade berberine for metabolic health. Activates AMPK pathway similar to metformin.',
                buy_url: 'https://example.com/apothecary-berberine',
                images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Clinical CoQ10 Ubiquinol',
                slug: 'clinical-coq10-ubiquinol',
                problem_solved: 'Mitochondrial energy production and cardiovascular support',
                ai_summary: 'Reduced form of CoQ10 for immediate bioavailability. Critical for cellular ATP synthesis and antioxidant defense.',
                buy_url: 'https://example.com/clinical-coq10',
                images: ['https://images.unsplash.com/photo-1550572017-4814c6f5a5e6?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Forest Lion\'s Mane Mushroom',
                slug: 'forest-lions-mane-mushroom',
                problem_solved: 'Neurogenesis and cognitive longevity',
                ai_summary: 'Dual-extracted fruiting body with hericenones and erinacines. Supports NGF production for brain health.',
                buy_url: 'https://example.com/forest-lionsmane',
                images: ['https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: false,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Obsidian Glycine Powder',
                slug: 'obsidian-glycine-powder',
                problem_solved: 'Collagen synthesis and sleep architecture optimization',
                ai_summary: 'Pure glycine amino acid for deep sleep enhancement and connective tissue support. Lowers core body temperature.',
                buy_url: 'https://example.com/obsidian-glycine',
                images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Apothecary Spirulina Tablets',
                slug: 'apothecary-spirulina-tablets',
                problem_solved: 'Micronutrient density and detoxification support',
                ai_summary: 'Organic spirulina with complete amino acid profile. Rich in phycocyanin for antioxidant and anti-inflammatory effects.',
                buy_url: 'https://example.com/apothecary-spirulina',
                images: ['https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800'],
                is_sme_certified: false,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Clinical Methylfolate + B12',
                slug: 'clinical-methylfolate-b12',
                problem_solved: 'Methylation pathway optimization and homocysteine regulation',
                ai_summary: 'Bioactive B-vitamins bypassing MTHFR mutations. Essential for neurotransmitter synthesis and DNA repair.',
                buy_url: 'https://example.com/clinical-methylfolate',
                images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Forest Taurine',
                slug: 'forest-taurine',
                problem_solved: 'Electrolyte balance and cardiovascular function',
                ai_summary: 'Conditionally essential amino acid for heart rhythm regulation and bile salt formation. Supports healthy aging.',
                buy_url: 'https://example.com/forest-taurine',
                images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Obsidian Phosphatidylserine',
                slug: 'obsidian-phosphatidylserine',
                problem_solved: 'Cortisol regulation and cognitive performance under stress',
                ai_summary: 'Soy-free phosphatidylserine for cell membrane integrity. Clinically shown to blunt exercise-induced cortisol spike.',
                buy_url: 'https://example.com/obsidian-ps',
                images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Apothecary Bacopa Monnieri',
                slug: 'apothecary-bacopa-monnieri',
                problem_solved: 'Memory consolidation and learning enhancement',
                ai_summary: 'Standardized to 50% bacosides for nootropic effects. Traditional Ayurvedic herb with modern clinical validation.',
                buy_url: 'https://example.com/apothecary-bacopa',
                images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800'],
                is_sme_certified: false,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            },
            {
                title: 'Clinical Electrolyte Complex',
                slug: 'clinical-electrolyte-complex',
                problem_solved: 'Hydration optimization and mineral repletion',
                ai_summary: 'Balanced sodium, potassium, and magnesium for cellular hydration. Zero sugar formulation for metabolic health.',
                buy_url: 'https://example.com/clinical-electrolytes',
                images: ['https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800'],
                is_sme_certified: true,
                third_party_lab_verified: true,
                purity_tested: true,
                source_transparency: true,
                potency_verified: true,
                excipient_audit: true,
                operational_legitimacy: true
            }
        ];

        for (const product of products) {
            // Check if exists
            const existing = await sql`SELECT id FROM products WHERE slug = ${product.slug}`;

            if (existing.length > 0) {
                // Update
                await sql`
                UPDATE products 
                SET title = ${product.title},
                    problem_solved = ${product.problem_solved},
                    ai_summary = ${product.ai_summary},
                    buy_url = ${product.buy_url},
                    images = ${product.images},
                    is_sme_certified = ${product.is_sme_certified},
                    third_party_lab_verified = ${product.third_party_lab_verified},
                    purity_tested = ${product.purity_tested},
                    source_transparency = ${product.source_transparency},
                    potency_verified = ${product.potency_verified},
                    excipient_audit = ${product.excipient_audit},
                    operational_legitimacy = ${product.operational_legitimacy}
                WHERE slug = ${product.slug}
            `;
            } else {
                // Insert
                await sql`
              INSERT INTO products (
                title, slug, problem_solved, ai_summary, buy_url, images,
                is_sme_certified, third_party_lab_verified, purity_tested,
                source_transparency, potency_verified, excipient_audit,
                operational_legitimacy, created_at
              )
              VALUES (
                ${product.title},
                ${product.slug},
                ${product.problem_solved},
                ${product.ai_summary},
                ${product.buy_url},
                ${product.images},
                ${product.is_sme_certified},
                ${product.third_party_lab_verified},
                ${product.purity_tested},
                ${product.source_transparency},
                ${product.potency_verified},
                ${product.excipient_audit},
                ${product.operational_legitimacy},
                NOW()
              )
            `;
            }
        }

        // ==========================================
        // 3. SEED 10 STARTER DISCUSSIONS
        // ==========================================

        const discussions = [
            // ... (Repeating list from previous attempts)
            {
                title: 'The Gut-Brain Axis Protocol',
                content: `## Understanding the Bidirectional Highway

The gut-brain axis represents one of the most fascinating frontiers in modern health science. Recent research shows that our gut microbiome directly influences neurotransmitter production, immune function, and even mood regulation.

### Key Mechanisms:
- **Vagus Nerve Signaling**: Direct neural pathway from gut to brain
- **Microbial Metabolites**: SCFAs like butyrate cross the blood-brain barrier
- **Immune Modulation**: 70% of immune cells reside in the gut

### Evidence-Based Interventions:
1. **Prebiotics**: Resistant starch, inulin, FOS
2. **Probiotics**: Multi-strain formulations with Lactobacillus and Bifidobacterium
3. **Polyphenols**: Support beneficial bacteria growth

What protocols have you found effective for gut-brain optimization?`,
                author_id: testProfiles[0].id,
                tags: ['Gut Health', 'Mental Health', 'Research']
            },
            // (Just including one discussion example to keep file size manageable if re-pasted, but I must keep ALL 10 if I overwrite)
            // I will copy all 10 from previous turn to ensure completeness
            {
                title: 'Optimizing Circadian Rhythms for Longevity',
                content: `## The Master Clock of Health

Circadian rhythm disruption is linked to metabolic dysfunction, accelerated aging, and cognitive decline. Let's discuss evidence-based strategies for circadian optimization.

### Morning Protocol:
- Bright light exposure within 30 minutes of waking
- Protein-rich breakfast to anchor cortisol rhythm
- Cold exposure for norepinephrine spike

### Evening Protocol:
- Dim lights 2-3 hours before bed
- Blue light blocking (amber glasses)
- Temperature drop (65-68°F optimal)

### Supplements:
- Magnesium glycinate (400mg before bed)
- Glycine (3g for sleep architecture)
- Low-dose melatonin (0.3-1mg) if needed

Share your circadian optimization stack!`,
                author_id: testProfiles[3].id,
                tags: ['Sleep', 'Longevity', 'Biohacking']
            },
            {
                title: 'NAD+ Precursors: NMN vs NR Deep Dive',
                content: `## Comparing the Leading NAD+ Boosters

Both NMN and NR show promise for cellular energy and longevity, but which is superior?

### NMN (Nicotinamide Mononucleotide):
- Larger molecule, may require transporter
- More direct conversion to NAD+
- Emerging human studies showing benefits

### NR (Nicotinamide Riboside):
- Smaller, potentially better absorption
- More established research base
- Proven to raise NAD+ levels in humans

### The Data:
Recent studies suggest both are effective, but individual response varies. Factors include:
- Gut microbiome composition
- Existing NAD+ levels
- Age and metabolic health

What's your experience with NAD+ precursors?`,
                author_id: testProfiles[4].id,
                tags: ['Longevity', 'Supplements', 'Research']
            },
            {
                title: 'Magnesium Forms: A Comprehensive Comparison',
                content: `## Not All Magnesium is Created Equal

With 7+ forms of magnesium supplements available, choosing the right one matters.

### Magnesium Glycinate:
- Best for: Sleep, anxiety, muscle relaxation
- Absorption: Excellent
- GI tolerance: Superior

### Magnesium Threonate:
- Best for: Cognitive function, brain health
- Crosses blood-brain barrier
- Higher cost

### Magnesium Citrate:
- Best for: Constipation, general supplementation
- Good absorption
- May cause loose stools

### Clinical Insight:
Most people are deficient in magnesium. RDA is likely too low for optimal health. Consider 400-600mg daily from high-quality sources.

What form works best for you?`,
                author_id: testProfiles[1].id,
                tags: ['Supplements', 'Research', 'Wellness']
            },
            {
                title: 'The Case for Creatine Beyond Muscle',
                content: `## Creatine as a Nootropic and Longevity Compound

While bodybuilders have used creatine for decades, emerging research shows benefits far beyond muscle growth.

### Cognitive Benefits:
- Improved working memory
- Enhanced processing speed
- Neuroprotection under stress
- Potential benefits for depression

### Mechanism:
Creatine supports ATP regeneration in the brain, particularly during cognitively demanding tasks.

### Dosing:
- 5g daily (no loading phase needed)
- Monohydrate is gold standard
- Take with or without food

### Safety Profile:
One of the most studied supplements with excellent safety record. Kidney concerns are unfounded in healthy individuals.

Who else uses creatine primarily for cognitive benefits?`,
                author_id: testProfiles[2].id,
                tags: ['Supplements', 'Mental Health', 'Research']
            },
            {
                title: 'Omega-3 Dosing: More Isn\'t Always Better',
                content: `## Finding Your Optimal EPA/DHA Intake

The omega-3 supplement market is saturated with conflicting advice. Let's examine the evidence.

### Therapeutic Ranges:
- **General health**: 1-2g combined EPA/DHA
- **Cardiovascular support**: 2-4g
- **Inflammatory conditions**: 3-5g
- **Depression**: 1-2g EPA-dominant

### Quality Markers:
- TOTOX score <26
- Third-party tested for heavy metals
- Triglyceride form preferred over ethyl ester

### Oxidation Risk:
High-dose omega-3 without adequate antioxidants may be counterproductive. Consider pairing with vitamin E or astaxanthin.

What's your omega-3 protocol?`,
                author_id: testProfiles[0].id,
                tags: ['Supplements', 'Research', 'Wellness']
            },
            {
                title: 'Adaptogens for HPA Axis Regulation',
                content: `## Supporting Stress Resilience Naturally

The HPA (hypothalamic-pituitary-adrenal) axis governs our stress response. Chronic activation leads to dysfunction.

### Top Adaptogens:
1. **Ashwagandha**: Cortisol reduction, anxiety
2. **Rhodiola**: Mental fatigue, physical endurance
3. **Holy Basil**: Stress resilience, blood sugar
4. **Cordyceps**: Energy, athletic performance

### Cycling Strategy:
Consider 8 weeks on, 2 weeks off to maintain sensitivity.

### Caution:
Not all adaptogens suit everyone. Some may be too stimulating or sedating depending on individual physiology.

Share your adaptogen experiences!`,
                author_id: testProfiles[1].id,
                tags: ['Supplements', 'Wellness', 'Research']
            },
            {
                title: 'Vitamin D: The Sunshine Hormone Paradox',
                content: `## Why Supplementation Alone May Not Be Enough

Despite widespread supplementation, vitamin D deficiency remains epidemic. Why?

### The Cofactor Problem:
Vitamin D requires:
- Magnesium (for conversion)
- Vitamin K2 (for calcium regulation)
- Boron (for metabolism)
- Zinc (for receptor function)

### Optimal Levels:
- Standard range: 30-100 ng/mL
- Functional range: 50-80 ng/mL
- Individual variation is significant

### Testing Matters:
Supplement based on blood work, not assumptions. Some people need 10,000 IU daily to reach optimal levels.

### The K2 Connection:
Always pair D3 with K2 MK-7 to prevent arterial calcification.

What's your D3 protocol?`,
                author_id: testProfiles[4].id,
                tags: ['Supplements', 'Research', 'Prevention']
            },
            {
                title: 'Nootropic Stacking: Science vs Hype',
                content: `## Building an Evidence-Based Cognitive Stack

The nootropics space is filled with marketing claims. Let's focus on what actually works.

### Tier 1 (Strong Evidence):
- Caffeine + L-theanine
- Creatine monohydrate
- Omega-3 fatty acids
- Bacopa monnieri

### Tier 2 (Promising Evidence):
- Lion's mane mushroom
- Rhodiola rosea
- Alpha-GPC
- Phosphatidylserine

### Tier 3 (Theoretical):
- Racetams
- Noopept
- Semax

### Synergy Matters:
Individual compounds may be less effective than strategic combinations. Start with foundations before adding experimental compounds.

What's in your cognitive stack?`,
                author_id: testProfiles[2].id,
                tags: ['Supplements', 'Mental Health', 'Biohacking']
            },
            {
                title: 'Third-Party Testing: Why It Matters',
                content: `## The Supplement Industry's Dirty Secret

Studies show up to 70% of supplements don't contain what's on the label. Here's how to protect yourself.

### Red Flags:
- No third-party testing
- Proprietary blends (hiding doses)
- Unrealistic claims
- No COA (Certificate of Analysis) available

### Trusted Testing Organizations:
- NSF International
- USP Verified
- Informed Sport
- ConsumerLab

### What to Look For:
- Heavy metal testing
- Microbial contamination screening
- Potency verification
- Dissolution testing

### The SME Standard:
We only recommend products with transparent third-party testing and full disclosure of ingredients.

How do you vet your supplements?`,
                author_id: testProfiles[3].id,
                tags: ['Supplements', 'Research', 'Prevention']
            }
        ];

        for (const discussion of discussions) {
            // Generate unique slug logic (simplified for check)
            // Since we can't reliably predict the random suffix, we just INSERT ALWAYS for discussions unless we find exact title match or similar.
            // Actually, let's just use the title to check for existence to avoid dupes on re-run.

            const existing = await sql`SELECT id FROM discussions WHERE title = ${discussion.title}`;

            if (existing.length === 0) {
                const baseSlug = discussion.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                const uniqueSlug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

                await sql`
              INSERT INTO discussions (
                title, content, author_id, slug, tags, flag_count, is_flagged, upvote_count, created_at
              )
              VALUES (
                ${discussion.title},
                ${discussion.content},
                ${discussion.author_id},
                ${uniqueSlug},
                ${discussion.tags},
                0,
                false,
                ${Math.floor(Math.random() * 50) + 10},
                NOW()
              )
            `;
            }
        }

        const dbInfo = await sql`SELECT inet_server_addr() as ip, current_database() as db`;
        console.log('Seeding against DB:', dbInfo);

        return NextResponse.json({
            status: 'Production Seeded Successfully',
            details: {
                profiles: 5,
                products: 20,
                discussions: 'Assumed 10 (skipped duplicates)',
                logs,
                connected_to: dbInfo[0]
            }
        });

    } catch (error) {
        console.error('Production seed failed:', error);
        return NextResponse.json(
            {
                error: 'Production seed failed',
                details: error instanceof Error ? error.message : String(error),
                logs
            },
            { status: 500 }
        );
    }
}
