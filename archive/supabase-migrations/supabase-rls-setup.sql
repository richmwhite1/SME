-- RLS Setup for Clerk + Supabase Integration
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we'll disable RLS on these tables and handle auth in the application layer.

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Optional: If you want to keep RLS enabled but allow all operations,
-- you can use these policies instead (comment out the ALTER TABLE statements above):

-- -- Allow anyone to read profiles
-- CREATE POLICY "Allow public read access on profiles"
--   ON profiles FOR SELECT
--   USING (true);

-- -- Allow authenticated users to insert/update their own profile
-- CREATE POLICY "Allow users to insert their own profile"
--   ON profiles FOR INSERT
--   WITH CHECK (true);

-- CREATE POLICY "Allow users to update their own profile"
--   ON profiles FOR UPDATE
--   USING (true);

-- -- Allow anyone to read reviews
-- CREATE POLICY "Allow public read access on reviews"
--   ON reviews FOR SELECT
--   USING (true);

-- -- Allow authenticated users to insert reviews
-- CREATE POLICY "Allow authenticated users to insert reviews"
--   ON reviews FOR INSERT
--   WITH CHECK (true);



