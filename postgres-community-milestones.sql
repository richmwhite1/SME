-- =====================================================
-- Community Milestones Table
-- =====================================================
-- Tracks community achievements and progress milestones
-- =====================================================

CREATE TABLE IF NOT EXISTS community_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('verified_audits', 'community_size', 'trusted_voices', 'evidence_sources')),
  target_value INTEGER NOT NULL,
  achieved_value INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata for additional context
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_milestones_is_displayed ON community_milestones(is_displayed) WHERE is_displayed = true;
CREATE INDEX IF NOT EXISTS idx_milestones_achieved_at ON community_milestones(achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON community_milestones(milestone_type);

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE community_milestones DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE community_milestones IS 'Community achievement milestones for celebrating collective progress';
COMMENT ON COLUMN community_milestones.title IS 'Short title for the milestone (e.g., "500 Verified Audits")';
COMMENT ON COLUMN community_milestones.description IS 'Full description message displayed to users';
COMMENT ON COLUMN community_milestones.milestone_type IS 'Type of milestone: verified_audits, community_size, trusted_voices, evidence_sources';
COMMENT ON COLUMN community_milestones.is_displayed IS 'Whether this milestone should be shown to all users';
COMMENT ON COLUMN community_milestones.metadata IS 'Additional JSON data for milestone context';

-- Example milestone (can be inserted manually or via admin)
-- INSERT INTO community_milestones (title, description, milestone_type, target_value, achieved_value, is_displayed)
-- VALUES (
--   '500 Verified Audits',
--   'The community has verified 500 products for the gut, heart, and mind.',
--   'verified_audits',
--   500,
--   500,
--   true
-- );



