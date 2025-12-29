-- =====================================================
-- Product Technical Specifications Extension
-- =====================================================
-- Adds fields for active ingredients, lab links, excipients
-- and pillar scores for SME Radar Chart integration
-- =====================================================

-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_ingredients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS third_party_lab_link TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS excipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pillar_scores JSONB DEFAULT '{}'::jsonb;

-- Create indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_products_active_ingredients ON products USING GIN (active_ingredients);
CREATE INDEX IF NOT EXISTS idx_products_excipients ON products USING GIN (excipients);
CREATE INDEX IF NOT EXISTS idx_products_pillar_scores ON products USING GIN (pillar_scores);

-- Add comments for documentation
COMMENT ON COLUMN products.active_ingredients IS 'Array of active ingredients with dosages: [{"name": "Curcumin", "dosage": "500mg"}]';
COMMENT ON COLUMN products.third_party_lab_link IS 'Link to third-party laboratory testing results';
COMMENT ON COLUMN products.excipients IS 'Array of fillers and inactive ingredients: ["Cellulose", "Magnesium Stearate"]';
COMMENT ON COLUMN products.pillar_scores IS 'Scores mapped to the 12 Pillars for SME Radar Chart: {"Gut Health": 85, "Mental Health": 70}';

-- =====================================================
-- EXTENSION COMPLETE
-- =====================================================
