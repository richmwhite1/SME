-- Create product_truth_signals table
CREATE TABLE IF NOT EXISTS product_truth_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  signal TEXT NOT NULL,
  lens_type TEXT NOT NULL CHECK (lens_type IN ('scientific', 'alternative', 'esoteric')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_truth_signals_product_id ON product_truth_signals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_truth_signals_lens_type ON product_truth_signals(lens_type);

-- Disable RLS
ALTER TABLE product_truth_signals DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_truth_signals IS 'Signals/attributes associated with a product, categorized by lens type';
