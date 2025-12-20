-- =====================================================
-- Fix Images Storage - Ensure Column is Correct Type
-- =====================================================
-- Run this to verify and fix the images column
-- =====================================================

-- Check current column definition
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'protocols' 
  AND column_name = 'images';

-- If the column doesn't exist or is wrong type, run this:
-- ALTER TABLE protocols ADD COLUMN IF NOT EXISTS images TEXT[];

-- Verify the column accepts arrays
SELECT 
  id,
  title,
  images,
  pg_typeof(images) as column_type,
  array_length(images, 1) as array_length
FROM protocols
WHERE images IS NOT NULL
LIMIT 5;

-- Test inserting an array directly (should work)
-- UPDATE protocols 
-- SET images = ARRAY['https://test1.com/img.jpg', 'https://test2.com/img.jpg']::TEXT[]
-- WHERE id = 'YOUR-PRODUCT-ID-HERE'
-- RETURNING id, title, images;

-- =====================================================
-- If images column is TEXT[], Supabase should handle it
-- If it's JSONB or another type, we need to change it
-- =====================================================




