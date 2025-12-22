-- =====================================================
-- PRODUCTS TABLE ALIAS
-- =====================================================
-- Create products table as an alias/view of protocols
-- This maintains backward compatibility with code that references "products"
-- =====================================================

-- Option 1: Create a view (recommended for read operations)
CREATE OR REPLACE VIEW products AS
SELECT * FROM protocols;

-- Option 2: If you want to fully rename the table (more invasive)
-- Uncomment these lines if you want to rename protocols to products permanently:

/*
ALTER TABLE protocols RENAME TO products;
ALTER INDEX idx_protocols_slug RENAME TO idx_products_slug;
ALTER INDEX idx_protocols_created_at RENAME TO idx_products_created_at;
ALTER INDEX idx_protocols_images RENAME TO idx_products_images;
ALTER INDEX idx_protocols_is_sme_certified RENAME TO idx_products_is_sme_certified;
*/

-- For now, we'll use the view approach which allows both names to work
COMMENT ON VIEW products IS 'View alias for protocols table - maintains backward compatibility';

-- =====================================================
-- PRODUCTS VIEW COMPLETE
-- =====================================================
