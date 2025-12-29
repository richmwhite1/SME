-- =====================================================
-- Product Benefits Schema - SEO Enhancement
-- =====================================================
-- Creates table for product benefits with evidence-based validation
-- Supports both official (brand-submitted) and community-suggested benefits
-- =====================================================

-- Create product_benefits table
CREATE TABLE IF NOT EXISTS product_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  benefit_title TEXT NOT NULL,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('anecdotal', 'evidence_based')),
  citation_url TEXT,
  source_type TEXT DEFAULT 'official' CHECK (source_type IN ('official', 'community')),
  submitted_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Evidence-based benefits must have a citation
  CONSTRAINT evidence_requires_citation CHECK (
    benefit_type = 'anecdotal' OR 
    (benefit_type = 'evidence_based' AND citation_url IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_benefits_product_id ON product_benefits(product_id);
CREATE INDEX IF NOT EXISTS idx_product_benefits_source_type ON product_benefits(source_type);
CREATE INDEX IF NOT EXISTS idx_product_benefits_verified ON product_benefits(is_verified);
CREATE INDEX IF NOT EXISTS idx_product_benefits_upvotes ON product_benefits(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_product_benefits_created_at ON product_benefits(created_at DESC);

-- Disable RLS for Clerk integration
ALTER TABLE product_benefits DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE product_benefits IS 'Product benefits with evidence-based validation for SEO/LLM indexing';
COMMENT ON COLUMN product_benefits.benefit_type IS 'Type: anecdotal (user experience) or evidence_based (requires citation)';
COMMENT ON COLUMN product_benefits.source_type IS 'Source: official (brand-submitted) or community (user-suggested)';
COMMENT ON COLUMN product_benefits.citation_url IS 'Required for evidence_based benefits - link to study/research';
COMMENT ON COLUMN product_benefits.is_verified IS 'Whether the benefit has been verified by SME or admin';

-- Create benefit_votes table for tracking user votes
CREATE TABLE IF NOT EXISTS benefit_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id UUID NOT NULL REFERENCES product_benefits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one vote per user per benefit
  CONSTRAINT unique_user_benefit_vote UNIQUE (user_id, benefit_id)
);

CREATE INDEX IF NOT EXISTS idx_benefit_votes_benefit_id ON benefit_votes(benefit_id);
CREATE INDEX IF NOT EXISTS idx_benefit_votes_user_id ON benefit_votes(user_id);

ALTER TABLE benefit_votes DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE benefit_votes IS 'User votes on product benefits (upvote/downvote)';

-- Function to toggle benefit vote
CREATE OR REPLACE FUNCTION toggle_benefit_vote(
  p_user_id TEXT,
  p_benefit_id UUID,
  p_vote_type TEXT
)
RETURNS TABLE(
  voted BOOLEAN,
  new_upvote_count INTEGER,
  new_downvote_count INTEGER
) AS $$
DECLARE
  v_existing_vote TEXT;
  v_upvotes INTEGER;
  v_downvotes INTEGER;
BEGIN
  -- Check if vote already exists
  SELECT vote_type INTO v_existing_vote
  FROM benefit_votes
  WHERE user_id = p_user_id AND benefit_id = p_benefit_id;
  
  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote = p_vote_type THEN
      -- Remove vote (user clicked same button)
      DELETE FROM benefit_votes
      WHERE user_id = p_user_id AND benefit_id = p_benefit_id;
      
      -- Update counts
      IF p_vote_type = 'upvote' THEN
        UPDATE product_benefits
        SET upvote_count = GREATEST(upvote_count - 1, 0)
        WHERE id = p_benefit_id;
      ELSE
        UPDATE product_benefits
        SET downvote_count = GREATEST(downvote_count - 1, 0)
        WHERE id = p_benefit_id;
      END IF;
    ELSE
      -- Change vote type
      UPDATE benefit_votes
      SET vote_type = p_vote_type
      WHERE user_id = p_user_id AND benefit_id = p_benefit_id;
      
      -- Update counts (remove old, add new)
      IF p_vote_type = 'upvote' THEN
        UPDATE product_benefits
        SET upvote_count = upvote_count + 1,
            downvote_count = GREATEST(downvote_count - 1, 0)
        WHERE id = p_benefit_id;
      ELSE
        UPDATE product_benefits
        SET downvote_count = downvote_count + 1,
            upvote_count = GREATEST(upvote_count - 1, 0)
        WHERE id = p_benefit_id;
      END IF;
    END IF;
  ELSE
    -- Add new vote
    INSERT INTO benefit_votes (user_id, benefit_id, vote_type)
    VALUES (p_user_id, p_benefit_id, p_vote_type);
    
    -- Update counts
    IF p_vote_type = 'upvote' THEN
      UPDATE product_benefits
      SET upvote_count = upvote_count + 1
      WHERE id = p_benefit_id;
    ELSE
      UPDATE product_benefits
      SET downvote_count = downvote_count + 1
      WHERE id = p_benefit_id;
    END IF;
  END IF;
  
  -- Get updated counts
  SELECT upvote_count, downvote_count INTO v_upvotes, v_downvotes
  FROM product_benefits
  WHERE id = p_benefit_id;
  
  RETURN QUERY SELECT 
    EXISTS(SELECT 1 FROM benefit_votes WHERE user_id = p_user_id AND benefit_id = p_benefit_id),
    v_upvotes,
    v_downvotes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION toggle_benefit_vote IS 'Atomically toggle benefit vote and update counts';

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
