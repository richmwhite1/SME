-- =====================================================
-- Products Table Creation
-- =====================================================
-- Run this SQL in your Railway Postgres terminal to create the products table
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE products IS 'Health products with name, category, and description';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.category IS 'Product category (e.g., Probiotic, Magnesium, Adaptogen, Nootropic, Herbal)';
COMMENT ON COLUMN products.description IS 'Product description';

