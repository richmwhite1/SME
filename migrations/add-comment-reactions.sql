-- Create comment_reactions table if not exists
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES discussion_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk ID
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id, emoji)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Add RLS policies (if enabled, assuming standard setup)
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON comment_reactions;
CREATE POLICY "Reactions are viewable by everyone" 
ON comment_reactions FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own reactions
DROP POLICY IF EXISTS "Users can add their own reactions" ON comment_reactions;
CREATE POLICY "Users can add their own reactions" 
ON comment_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions
DROP POLICY IF EXISTS "Users can remove their own reactions" ON comment_reactions;
CREATE POLICY "Users can remove their own reactions" 
ON comment_reactions FOR DELETE 
USING (auth.uid() = user_id);
