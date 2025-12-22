-- =====================================================
-- Guest Comments Support for Product Comments
-- =====================================================
-- This script adds support for guest comments on products
-- Guest comments require AI moderation and have a guest_name field
-- =====================================================

-- Step 1: Add guest_name column to product_comments table
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Step 2: Add comment to explain the column
COMMENT ON COLUMN product_comments.guest_name IS 'Name provided by guest users (unauthenticated). Only set when author_id is NULL.';

-- Step 3: Add constraint to ensure guest_name is only set when author_id is NULL
ALTER TABLE product_comments
DROP CONSTRAINT IF EXISTS check_guest_product_comment;

ALTER TABLE product_comments
ADD CONSTRAINT check_guest_product_comment 
CHECK (
  (author_id IS NOT NULL AND guest_name IS NULL) OR 
  (author_id IS NULL AND guest_name IS NOT NULL)
);

-- Step 4: Create index for guest comments lookup
CREATE INDEX IF NOT EXISTS idx_product_comments_guest_name 
ON product_comments(guest_name) 
WHERE guest_name IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the schema:

-- 1. Check column exists:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'product_comments' 
-- AND column_name = 'guest_name';

-- 2. Check constraint:
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'product_comments' 
-- AND constraint_name = 'check_guest_product_comment';

-- =====================================================
-- COMPLETE
-- =====================================================
-- After running this script:
-- 1. Guest comments can be created with guest_name when author_id is NULL
-- 2. Authenticated comments must have author_id and no guest_name
-- 3. The constraint ensures data integrity
-- =====================================================


