-- =====================================================
-- Product Information Enhancement Migration
-- =====================================================
-- Adds missing fields from onboarding wizard to products table
-- and enhances product_truth_signals with justification text
-- =====================================================

-- Add missing fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS lab_report_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT; -- Job function from onboarding
ALTER TABLE products ADD COLUMN IF NOT EXISTS serving_size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS servings_per_container TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS form TEXT; -- Capsules, Powder, Liquid, etc.
ALTER TABLE products ADD COLUMN IF NOT EXISTS recommended_dosage TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS best_time_take TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS contraindications TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS side_effects TEXT[];

-- Add reason/justification to product_truth_signals
ALTER TABLE product_truth_signals ADD COLUMN IF NOT EXISTS reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_form ON products(form);
CREATE INDEX IF NOT EXISTS idx_products_lab_report_url ON products(lab_report_url) WHERE lab_report_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.lab_report_url IS 'URL to lab report or clinical study document';
COMMENT ON COLUMN products.category IS 'Primary job function/use case (e.g., Brain Fog, Sleep, Gut Health)';
COMMENT ON COLUMN products.serving_size IS 'Serving size (e.g., "1 scoop (12g)", "2 capsules")';
COMMENT ON COLUMN products.servings_per_container IS 'Number of servings per container (e.g., "30", "60")';
COMMENT ON COLUMN products.form IS 'Product form (Capsules, Tablets, Powder, Liquid, Gummies, etc.)';
COMMENT ON COLUMN products.recommended_dosage IS 'Recommended dosage instructions';
COMMENT ON COLUMN products.best_time_take IS 'Best time to take (e.g., "Morning with breakfast", "Before bed")';
COMMENT ON COLUMN products.storage_instructions IS 'Storage instructions (e.g., "Store in a cool, dry place")';
COMMENT ON COLUMN products.contraindications IS 'Array of contraindications (who should not take this)';
COMMENT ON COLUMN products.side_effects IS 'Array of potential side effects';
COMMENT ON COLUMN product_truth_signals.reason IS 'Justification/evidence for this truth signal';

-- =====================================================
-- COMPLETE
-- =====================================================
