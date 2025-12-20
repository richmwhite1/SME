-- =====================================================
-- COMPLETE FIX: Discussions 500 Error Resolution
-- =====================================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure profiles table exists for Clerk integration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
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

-- Disable RLS on profiles table for Clerk
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create discussions table if it doesn't exist
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to discussions table
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_slug ON discussions(slug);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_tags ON discussions USING GIN(tags);

-- Step 3: DISABLE RLS on discussions table (CRITICAL FOR CLERK)
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify the fixes
SELECT
  'profiles' as table_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles'
UNION ALL
SELECT
  'discussions' as table_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'discussions';

-- Check if discussions table has the right structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'discussions'
ORDER BY ordinal_position;

-- =====================================================
-- COMPLETE - Try creating a discussion now!
-- =====================================================


