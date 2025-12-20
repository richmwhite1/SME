-- =====================================================
-- Fix Profiles Table Foreign Key for Clerk Integration
-- =====================================================
-- Ensures profiles table exists and has correct structure for Clerk
-- =====================================================

-- First, check if profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Create profiles table if it doesn't exist
    CREATE TABLE profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT,
      username TEXT UNIQUE,
      email TEXT,
      avatar_url TEXT,
      bio TEXT,
      website_url TEXT,
      credentials TEXT,
      contributor_score INTEGER DEFAULT 0,
      badge_type TEXT DEFAULT 'Member',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Disable RLS for Clerk integration
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Created profiles table for Clerk integration';
  ELSE
    RAISE NOTICE 'Profiles table already exists';
  END IF;
END $$;

-- Ensure all required columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id TEXT PRIMARY KEY;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contributor_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_type TEXT DEFAULT 'Member';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this in Supabase SQL Editor BEFORE the RLS fix
-- =====================================================


