
-- Rename user_id to author_id if it exists, otherwise create author_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_comments' AND column_name = 'user_id') THEN
        ALTER TABLE product_comments RENAME COLUMN user_id TO author_id;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_comments' AND column_name = 'author_id') THEN
        ALTER TABLE product_comments ADD COLUMN author_id TEXT;
    END IF;
END $$;

-- Add guest_name if it doesn't exist
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Add flag_count if it doesn't exist
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;

-- Make sure product_id exists (it does, but just in case)
-- (It was seen in inspection, so we are good)

-- Drop protocol_id if exists (cleanup)
ALTER TABLE product_comments 
DROP COLUMN IF EXISTS protocol_id;

-- Ensure RLS policies or indexes if needed? 
-- For now let's just fix the structure.
