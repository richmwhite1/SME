-- =====================================================
-- Verify Images Are Saved in Database
-- =====================================================
-- Run this query to check if images are being saved
-- =====================================================

-- Check all products and their images
SELECT 
  id,
  title,
  images,
  CASE 
    WHEN images IS NULL THEN 'NULL'
    WHEN images = '{}' THEN 'EMPTY ARRAY'
    WHEN jsonb_typeof(images::jsonb) = 'array' THEN 'ARRAY'
    ELSE 'OTHER'
  END as images_type,
  array_length(images::text[], 1) as image_count
FROM protocols
ORDER BY created_at DESC
LIMIT 10;

-- Check if any products have images
SELECT 
  COUNT(*) as total_products,
  COUNT(images) as products_with_images,
  COUNT(*) FILTER (WHERE images IS NOT NULL AND array_length(images::text[], 1) > 0) as products_with_image_urls
FROM protocols;

-- Show detailed image data for products with images
SELECT 
  id,
  title,
  images,
  images::text as images_as_text
FROM protocols
WHERE images IS NOT NULL 
  AND array_length(images::text[], 1) > 0
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- If images are NULL or empty, they're not being saved
-- Check the server console logs during product creation
-- =====================================================




