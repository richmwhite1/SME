-- Assign categories (tags) to production products
BEGIN;

UPDATE products SET tags = ARRAY['Sleep', 'Cognition'] WHERE slug = 'forest-magnesium-glycinate';
UPDATE products SET tags = ARRAY['Longevity', 'Immunity'] WHERE slug = 'obsidian-omega-3-complex';
UPDATE products SET tags = ARRAY['Cognition', 'Immunity'] WHERE slug = 'apothecary-ashwagandha-ksm66';
UPDATE products SET tags = ARRAY['Immunity', 'Longevity'] WHERE slug = 'clinical-vitamin-d3-k2-mk7';
UPDATE products SET tags = ARRAY['Cognition', 'Fitness'] WHERE slug = 'forest-creatine-monohydrate';
UPDATE products SET tags = ARRAY['Longevity', 'Cognition'] WHERE slug = 'obsidian-nad-precursor-complex';
UPDATE products SET tags = ARRAY['Cognition', 'Sleep'] WHERE slug = 'apothecary-l-theanine';
UPDATE products SET tags = ARRAY['Longevity', 'Immunity'] WHERE slug = 'clinical-curcumin-phytosome';
UPDATE products SET tags = ARRAY['Cognition', 'Longevity'] WHERE slug = 'forest-rhodiola-rosea-extract';
UPDATE products SET tags = ARRAY['Immunity', 'Fitness'] WHERE slug = 'obsidian-zinc-bisglycinate';
UPDATE products SET tags = ARRAY['Longevity', 'Gut Health'] WHERE slug = 'apothecary-berberine-hcl';
UPDATE products SET tags = ARRAY['Longevity', 'Immunity'] WHERE slug = 'clinical-coq10-ubiquinol';
UPDATE products SET tags = ARRAY['Cognition', 'Immunity'] WHERE slug = 'forest-lions-mane-mushroom';
UPDATE products SET tags = ARRAY['Sleep', 'Longevity'] WHERE slug = 'obsidian-glycine-powder';
UPDATE products SET tags = ARRAY['Immunity', 'Gut Health'] WHERE slug = 'apothecary-spirulina-tablets';
UPDATE products SET tags = ARRAY['Cognition', 'Longevity'] WHERE slug = 'clinical-methylfolate-b12';
UPDATE products SET tags = ARRAY['Longevity', 'Fitness'] WHERE slug = 'forest-taurine';
UPDATE products SET tags = ARRAY['Cognition', 'Sleep'] WHERE slug = 'obsidian-phosphatidylserine';
UPDATE products SET tags = ARRAY['Cognition', 'Longevity'] WHERE slug = 'apothecary-bacopa-monnieri';
UPDATE products SET tags = ARRAY['Immunity', 'Fitness'] WHERE slug = 'clinical-electrolyte-complex';

COMMIT;
