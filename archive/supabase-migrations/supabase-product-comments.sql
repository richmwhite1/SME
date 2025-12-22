-- =====================================================
-- Product Comments Table
-- =====================================================
-- Creates the product_comments table for comments on products/protocols
-- =====================================================

-- First, create the table without the foreign key constraint
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints separately (if the referenced tables exist)
-- This allows the table to be created even if foreign keys fail
DO $$
BEGIN
  -- Add foreign key to protocols table (if it exists and has an id column)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'protocols') THEN
    BEGIN
      ALTER TABLE product_comments 
        ADD CONSTRAINT product_comments_protocol_id_fkey 
        FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key to protocols table: %', SQLERRM;
    END;
  END IF;

  -- Add foreign key to profiles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN
      ALTER TABLE product_comments 
        ADD CONSTRAINT product_comments_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key to profiles table: %', SQLERRM;
    END;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_comments_protocol_id ON product_comments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author_id ON product_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_comments_is_flagged ON product_comments(is_flagged) WHERE is_flagged = true;

-- RLS (Row Level Security) - DISABLED for Clerk Integration
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we disable RLS and handle authentication in the application layer.
ALTER TABLE product_comments DISABLE ROW LEVEL SECURITY;

-- Note: Authentication is handled in the application layer using Clerk's currentUser()
-- The server actions already check for authentication before allowing inserts/updates.

-- Add comments
COMMENT ON TABLE product_comments IS 'Comments on products/protocols';
COMMENT ON COLUMN product_comments.flag_count IS 'Number of times this comment has been flagged';
COMMENT ON COLUMN product_comments.is_flagged IS 'Whether this comment is hidden due to flagging (3+ flags)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the product comments table.
-- =====================================================

