-- =====================================================
-- Product Images Support
-- =====================================================
-- Adds images column to protocols table for multi-image support
-- =====================================================

-- Add images column (array of text URLs)
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS images TEXT[];

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_protocols_images ON protocols USING GIN(images);

-- Add comment
COMMENT ON COLUMN protocols.images IS 'Array of image URLs (up to 10) stored in product-images bucket';

-- =====================================================
-- Storage Bucket Setup (Run in Supabase Dashboard)
-- =====================================================
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named 'product-images'
-- 3. Set it to Public
-- 4. Add policy:
--    - Policy name: "Public read access"
--    - Policy definition: SELECT
--    - Target roles: anon, authenticated
--    - USING expression: true
--    - WITH CHECK expression: true
-- 5. Add policy for admin uploads:
--    - Policy name: "Admin upload access"
--    - Policy definition: INSERT, UPDATE
--    - Target roles: authenticated
--    - USING expression: (
--        EXISTS (
--          SELECT 1 FROM profiles 
--          WHERE profiles.id = auth.uid() 
--          AND profiles.is_admin = true
--        )
--      )
--    - WITH CHECK expression: (
--        EXISTS (
--          SELECT 1 FROM profiles 
--          WHERE profiles.id = auth.uid() 
--          AND profiles.is_admin = true
--        )
--      )
-- =====================================================

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- the images column for multi-image support.
-- Then set up the storage bucket as described above.
-- =====================================================




