-- Add Dossier View Fields to Products Table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS community_consensus_score INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_scientific INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_alternative INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_esoteric INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS certification_vault_urls TEXT[];

-- Create indexes for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_products_community_consensus_score ON products(community_consensus_score);

-- Add comments
COMMENT ON COLUMN products.brand IS 'Brand name of the product manufacturer';
COMMENT ON COLUMN products.community_consensus_score IS 'Overall community consensus score (0-100)';
COMMENT ON COLUMN products.score_scientific IS 'Scientific lens score (0-100)';
COMMENT ON COLUMN products.score_alternative IS 'Alternative/Holistic lens score (0-100)';
COMMENT ON COLUMN products.score_esoteric IS 'Esoteric/Traditional lens score (0-100)';
COMMENT ON COLUMN products.certification_vault_urls IS 'Array of URLs for certification PDFs (The Vault)';
