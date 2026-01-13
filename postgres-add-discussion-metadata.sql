-- Add metadata column to discussions table
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN discussions.metadata IS 'Additional metadata like x_post_url';
