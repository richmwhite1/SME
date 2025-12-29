-- Create Smoke Test Omega product if it doesn't exist
INSERT INTO products (
  title,
  slug,
  brand,
  problem_solved,
  ai_summary,
  admin_status,
  is_verified,
  created_at
)
VALUES (
  'Smoke Test Omega',
  'smoke-test-omega',
  'Test Brand',
  'Test product for SME review system verification',
  'This is a test product created specifically for verifying the 9-pillar SME review system. It allows SMEs to submit partial reviews and verify that N/A values display correctly.',
  'approved',
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- Get the product ID
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  SELECT id INTO v_product_id FROM products WHERE slug = 'smoke-test-omega' LIMIT 1;
  RAISE NOTICE 'Smoke Test Omega product ID: %', v_product_id;
END $$;
