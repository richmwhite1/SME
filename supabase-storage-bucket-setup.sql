-- =====================================================
-- Storage Bucket Setup for Product Images
-- =====================================================
-- Creates the product-images bucket and sets up policies
-- IMPORTANT: Since we're using Clerk (not Supabase Auth),
-- we need to disable RLS or use service role for uploads
-- =====================================================

-- Create the bucket (if it doesn't exist)
-- Note: Bucket creation must be done in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Name: product-images
-- Public: Yes

-- =====================================================
-- Storage Policies (Run these after creating the bucket)
-- =====================================================

-- Since we're using Clerk, we can't use auth.uid() in policies
-- Instead, we'll make the bucket public for reads and use
-- application-level authentication for uploads

-- Policy 1: Public read access (anyone can view images)
INSERT INTO storage.policies (bucket_id, name, definition, check_definition, role)
SELECT 
  'product-images',
  'Public read access',
  'true',
  'true',
  'anon'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'product-images' 
  AND name = 'Public read access'
);

INSERT INTO storage.policies (bucket_id, name, definition, check_definition, role)
SELECT 
  'product-images',
  'Public read access authenticated',
  'true',
  'true',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'product-images' 
  AND name = 'Public read access authenticated'
);

-- Policy 2: Allow uploads (we'll handle auth in application layer)
-- Since Clerk doesn't integrate with Supabase Auth, we need to allow
-- uploads through the service role or disable RLS on the bucket
-- For now, we'll allow authenticated users to upload
-- (Authentication will be checked in the application layer)

INSERT INTO storage.policies (bucket_id, name, definition, check_definition, role)
SELECT 
  'product-images',
  'Allow authenticated uploads',
  'true',
  'true',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'product-images' 
  AND name = 'Allow authenticated uploads'
);

-- =====================================================
-- ALTERNATIVE: Disable RLS on bucket (if policies don't work)
-- =====================================================
-- If the above policies don't work with Clerk, you can disable RLS:
-- UPDATE storage.buckets SET public = true, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'] WHERE id = 'product-images';

-- =====================================================
-- MANUAL SETUP INSTRUCTIONS
-- =====================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create Bucket"
-- 3. Name: product-images
-- 4. Public: Yes (toggle on)
-- 5. File size limit: 5MB (5242880 bytes)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp
-- 7. Click "Create bucket"
-- 
-- Then run the policies above, OR if they don't work:
-- 8. Go to Storage > product-images > Settings
-- 9. Toggle "Public bucket" to ON
-- 10. The application will handle authentication for uploads
-- =====================================================





