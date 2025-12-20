-- =====================================================
-- Test Image Insert to Verify Array Format
-- =====================================================
-- Run this to test if images can be inserted correctly
-- =====================================================

-- Test 1: Insert a product with images array
-- This should work if the column is set up correctly
INSERT INTO protocols (
  title,
  problem_solved,
  slug,
  created_by,
  images
) VALUES (
  'TEST PRODUCT - DELETE ME',
  'This is a test product to verify image array storage',
  'test-product-delete-me',
  '00000000-0000-0000-0000-000000000000', -- Dummy UUID
  ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg']::TEXT[]
)
RETURNING id, title, images, images::text as images_as_text;

-- Test 2: Check what format the images are stored in
SELECT 
  id,
  title,
  images,
  pg_typeof(images) as images_column_type,
  images::text as images_as_text,
  array_length(images, 1) as image_count,
  images[1] as first_image
FROM protocols
WHERE slug = 'test-product-delete-me';

-- Test 3: Clean up test product
-- DELETE FROM protocols WHERE slug = 'test-product-delete-me';

-- =====================================================
-- If the insert works, images should be stored as TEXT[]
-- If it fails, check the column definition
-- =====================================================




