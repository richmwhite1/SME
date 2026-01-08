-- =====================================================
-- Add User Role Management System
-- =====================================================
-- This migration adds a user_role column to replace
-- boolean permission flags with a cleaner role-based system
-- =====================================================

-- Step 1: Add user_role column with valid role constraints
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'standard' 
CHECK (user_role IN ('standard', 'sme', 'sme_admin', 'admin', 'business_user'));

-- Step 2: Migrate existing permissions to roles
-- Priority: admin > sme_admin (verified_expert) > sme > standard
UPDATE profiles
SET user_role = CASE
  WHEN is_admin = true THEN 'admin'
  WHEN is_verified_expert = true THEN 'sme_admin'
  WHEN is_sme = true THEN 'sme'
  ELSE 'standard'
END
WHERE user_role = 'standard'; -- Only update if not already set

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);

-- Step 4: Create helper function to check role hierarchy
CREATE OR REPLACE FUNCTION has_role_or_higher(check_user_id TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value TEXT;
  role_hierarchy TEXT[] := ARRAY['standard', 'business_user', 'sme', 'sme_admin', 'admin'];
  user_role_level INT;
  required_role_level INT;
BEGIN
  -- Get user's role
  SELECT user_role INTO user_role_value
  FROM profiles
  WHERE id = check_user_id;
  
  -- If user not found, return false
  IF user_role_value IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get role levels
  SELECT array_position(role_hierarchy, user_role_value) INTO user_role_level;
  SELECT array_position(role_hierarchy, required_role) INTO required_role_level;
  
  -- Compare levels
  RETURN user_role_level >= required_role_level;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Verify migration
SELECT 
  user_role,
  COUNT(*) as user_count
FROM profiles
GROUP BY user_role
ORDER BY 
  CASE user_role
    WHEN 'admin' THEN 1
    WHEN 'sme_admin' THEN 2
    WHEN 'sme' THEN 3
    WHEN 'business_user' THEN 4
    WHEN 'standard' THEN 5
  END;

-- =====================================================
-- NOTES:
-- - Old boolean columns (is_admin, is_sme, is_verified_expert) 
--   are kept for backward compatibility
-- - They will be deprecated in a future migration
-- - New code should use user_role instead
-- =====================================================
