-- =====================================================
-- FIX: Add missing is_flagged column to products table
-- =====================================================
-- This migration adds the is_flagged and flag_count columns
-- to the products table, which are referenced by various
-- queries but missing from the current schema.
-- =====================================================

-- Add is_flagged column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Add flag_count column to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;

-- Create index for performance (only index flagged items)
CREATE INDEX IF NOT EXISTS idx_products_is_flagged ON products(is_flagged) WHERE is_flagged = true;

-- Add comment for documentation
COMMENT ON COLUMN products.is_flagged IS 'Whether this product is hidden due to flagging (3+ flags)';
COMMENT ON COLUMN products.flag_count IS 'Number of times this product has been flagged';

-- Verify the columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_flagged'
    ) THEN
        RAISE NOTICE 'SUCCESS: is_flagged column exists in products table';
    ELSE
        RAISE EXCEPTION 'FAILED: is_flagged column not found in products table';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'flag_count'
    ) THEN
        RAISE NOTICE 'SUCCESS: flag_count column exists in products table';
    ELSE
        RAISE EXCEPTION 'FAILED: flag_count column not found in products table';
    END IF;
END $$;
