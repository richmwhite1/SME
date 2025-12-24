-- =====================================================
-- SME APPLICATION SYSTEM
-- =====================================================
-- Creates tables and views for SME candidate review process

-- 1. Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_tier INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_scientific INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_alternative INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_esoteric INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_completed_expert_profile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS needs_sme_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_reputation_score ON profiles(reputation_score);
CREATE INDEX IF NOT EXISTS idx_profiles_needs_sme_review ON profiles(needs_sme_review) WHERE needs_sme_review = true;

-- 2. Create sme_applications table
CREATE TABLE IF NOT EXISTS sme_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expertise_lens TEXT CHECK (expertise_lens IN ('Scientific', 'Alternative', 'Esoteric', 'Balanced')),
  statement_of_intent TEXT NOT NULL,
  portfolio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one application per user
  CONSTRAINT unique_user_application UNIQUE (user_id)
);

-- Create indexes for sme_applications
CREATE INDEX IF NOT EXISTS idx_sme_applications_user_id ON sme_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_sme_applications_status ON sme_applications(status);
CREATE INDEX IF NOT EXISTS idx_sme_applications_created_at ON sme_applications(created_at DESC);

-- Disable RLS
ALTER TABLE sme_applications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sme_applications IS 'Applications from users seeking SME (Subject Matter Expert) status';

-- 3. Create trigger function for SME consideration
CREATE OR REPLACE FUNCTION trigger_sme_consideration() RETURNS TRIGGER AS $$
BEGIN
  -- When a user hits 100 reputation, mark them for SME consideration
  IF NEW.reputation_score >= 100 AND (OLD.reputation_score IS NULL OR OLD.reputation_score < 100) THEN
    NEW.needs_sme_review := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sme_consideration_check ON profiles;
CREATE TRIGGER trigger_sme_consideration_check
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_sme_consideration();

-- 4. Create admin SME review queue view
CREATE OR REPLACE VIEW admin_sme_review_queue AS
SELECT 
    p.id as user_id,
    COALESCE(p.display_name, p.full_name, p.username, 'Anonymous') as display_name,
    p.reputation_score,
    p.reputation_tier,
    p.score_scientific,
    p.score_alternative,
    p.score_esoteric,
    p.preferred_topics,
    app.id as application_id,
    app.expertise_lens,
    app.statement_of_intent,
    app.portfolio_url,
    app.status,
    app.created_at,
    app.updated_at
FROM profiles p
JOIN sme_applications app ON p.id = app.user_id
WHERE app.status = 'pending'
ORDER BY p.reputation_score DESC, app.created_at ASC;

COMMENT ON VIEW admin_sme_review_queue IS 'Admin view of pending SME applications with candidate details';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
