-- =====================================================
-- COMMENT REACTIONS AND REPUTATION UPDATE
-- =====================================================

-- 1. Create Discussion Comment Reactions Table
CREATE TABLE IF NOT EXISTS discussion_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES discussion_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('scientific', 'experiential', 'safety', 'innovation', 'reliability')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one reaction type per user per comment
  CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id, reaction_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discussion_comment_reactions_comment ON discussion_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comment_reactions_user ON discussion_comment_reactions(user_id);

-- Disable RLS
ALTER TABLE discussion_comment_reactions DISABLE ROW LEVEL SECURITY;

-- 2. Create Product Comment Reactions Table
CREATE TABLE IF NOT EXISTS product_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES product_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('scientific', 'experiential', 'safety', 'innovation', 'reliability')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one reaction type per user per comment
  CONSTRAINT unique_user_product_comment_reaction UNIQUE (user_id, comment_id, reaction_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_comment_reactions_comment ON product_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_product_comment_reactions_user ON product_comment_reactions(user_id);

-- Disable RLS
ALTER TABLE product_comment_reactions DISABLE ROW LEVEL SECURITY;

-- 3. Add granular reputation columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reputation_scientific INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_experiential INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_safety INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_innovation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_reliability INTEGER DEFAULT 0;

-- 4. Update calculate_user_reputation function to include granular scores
CREATE OR REPLACE FUNCTION calculate_detailed_reputation(user_id_param TEXT)
RETURNS TABLE (
  total_score INTEGER,
  scientific_score INTEGER,
  experiential_score INTEGER,
  safety_score INTEGER,
  innovation_score INTEGER,
  reliability_score INTEGER
) AS $$
DECLARE
  v_upvote_score INTEGER := 0;
  v_scientific_count INTEGER := 0;
  v_experiential_count INTEGER := 0;
  v_safety_count INTEGER := 0;
  v_innovation_count INTEGER := 0;
  v_reliability_count INTEGER := 0;
  
  -- Weights
  w_scientific CONSTANT INTEGER := 5;
  w_innovation CONSTANT INTEGER := 5;
  w_experiential CONSTANT INTEGER := 3;
  w_reliability CONSTANT INTEGER := 2;
  w_safety CONSTANT INTEGER := 0; -- Safety doesn't add to total directly, but tracked separately
BEGIN
  -- 1. Calculate base upvotes (existing logic)
  -- Count upvotes on user's discussions
  SELECT COALESCE(SUM(d.upvote_count), 0) INTO v_upvote_score
  FROM discussions d
  WHERE d.author_id = user_id_param;
  
  -- Add upvotes on user's discussion comments
  v_upvote_score := v_upvote_score + (
    SELECT COALESCE(SUM(dc.upvote_count), 0)
    FROM discussion_comments dc
    WHERE dc.author_id = user_id_param
  );
  
  -- Add upvotes on user's product comments
  v_upvote_score := v_upvote_score + (
    SELECT COALESCE(SUM(pc.upvote_count), 0)
    FROM product_comments pc
    WHERE pc.user_id = user_id_param
  );

  -- 2. Calculate Reaction Counts across all comments (Discussion + Product)
  
  -- Scientific (Discussion Comments)
  SELECT COALESCE(COUNT(*), 0) INTO v_scientific_count
  FROM discussion_comment_reactions dcr
  JOIN discussion_comments dc ON dc.id = dcr.comment_id
  WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'scientific';
  
  -- Scientific (Product Comments)
  v_scientific_count := v_scientific_count + (
    SELECT COALESCE(COUNT(*), 0)
    FROM product_comment_reactions pcr
    JOIN product_comments pc ON pc.id = pcr.comment_id
    WHERE pc.user_id = user_id_param AND pcr.reaction_type = 'scientific'
  );

  -- Experiential (Discussion Comments)
  SELECT COALESCE(COUNT(*), 0) INTO v_experiential_count
  FROM discussion_comment_reactions dcr
  JOIN discussion_comments dc ON dc.id = dcr.comment_id
  WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'experiential';
  
  -- Experiential (Product Comments)
  v_experiential_count := v_experiential_count + (
    SELECT COALESCE(COUNT(*), 0)
    FROM product_comment_reactions pcr
    JOIN product_comments pc ON pc.id = pcr.comment_id
    WHERE pc.user_id = user_id_param AND pcr.reaction_type = 'experiential'
  );

  -- Safety (Discussion Comments)
  SELECT COALESCE(COUNT(*), 0) INTO v_safety_count
  FROM discussion_comment_reactions dcr
  JOIN discussion_comments dc ON dc.id = dcr.comment_id
  WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'safety';
  
  -- Safety (Product Comments)
  v_safety_count := v_safety_count + (
    SELECT COALESCE(COUNT(*), 0)
    FROM product_comment_reactions pcr
    JOIN product_comments pc ON pc.id = pcr.comment_id
    WHERE pc.user_id = user_id_param AND pcr.reaction_type = 'safety'
  );

  -- Innovation (Discussion Comments)
  SELECT COALESCE(COUNT(*), 0) INTO v_innovation_count
  FROM discussion_comment_reactions dcr
  JOIN discussion_comments dc ON dc.id = dcr.comment_id
  WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'innovation';
  
  -- Innovation (Product Comments)
  v_innovation_count := v_innovation_count + (
    SELECT COALESCE(COUNT(*), 0)
    FROM product_comment_reactions pcr
    JOIN product_comments pc ON pc.id = pcr.comment_id
    WHERE pc.user_id = user_id_param AND pcr.reaction_type = 'innovation'
  );

  -- Reliability (Discussion Comments)
  SELECT COALESCE(COUNT(*), 0) INTO v_reliability_count
  FROM discussion_comment_reactions dcr
  JOIN discussion_comments dc ON dc.id = dcr.comment_id
  WHERE dc.author_id = user_id_param AND dcr.reaction_type = 'reliability';
  
  -- Reliability (Product Comments)
  v_reliability_count := v_reliability_count + (
    SELECT COALESCE(COUNT(*), 0)
    FROM product_comment_reactions pcr
    JOIN product_comments pc ON pc.id = pcr.comment_id
    WHERE pc.user_id = user_id_param AND pcr.reaction_type = 'reliability'
  );

  -- 3. Return Granular Scores (Count * Weight implied for total, but plain count for specific scores? 
  --    Let's return the raw counts as the 'Detailed Score' for that category, 
  --    and the weighted sum for the Total Reputation.
  
  RETURN QUERY SELECT 
    (v_upvote_score + 
     (v_scientific_count * w_scientific) + 
     (v_innovation_count * w_innovation) + 
     (v_experiential_count * w_experiential) + 
     (v_reliability_count * w_reliability) + 
     (v_safety_count * w_safety)
    )::INTEGER as total_score,
    v_scientific_count::INTEGER,
    v_experiential_count::INTEGER,
    v_safety_count::INTEGER,
    v_innovation_count::INTEGER,
    v_reliability_count::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 5. Updated recalculate_and_update_reputation to use the new detailed function
CREATE OR REPLACE FUNCTION recalculate_and_update_reputation(user_id_param TEXT)
RETURNS TABLE(
  user_id TEXT,
  old_reputation INTEGER,
  new_reputation INTEGER,
  old_sme_status BOOLEAN,
  new_sme_status BOOLEAN
) AS $$
DECLARE
  v_old_reputation INTEGER;
  v_new_reputation INTEGER;
  v_old_sme_status BOOLEAN;
  v_new_sme_status BOOLEAN;
  
  -- Vars for detailed scores
  v_sci INTEGER;
  v_exp INTEGER;
  v_saf INTEGER;
  v_inn INTEGER;
  v_rel INTEGER;
BEGIN
  -- Get current values
  SELECT reputation_score, is_sme INTO v_old_reputation, v_old_sme_status
  FROM profiles
  WHERE id = user_id_param;
  
  -- Calculate new detailed reputation
  SELECT 
    total_score, 
    scientific_score, 
    experiential_score, 
    safety_score, 
    innovation_score, 
    reliability_score
  INTO 
    v_new_reputation,
    v_sci,
    v_exp,
    v_saf,
    v_inn,
    v_rel
  FROM calculate_detailed_reputation(user_id_param);
  
  -- Update profile with all scores
  UPDATE profiles
  SET 
    reputation_score = v_new_reputation,
    reputation_scientific = v_sci,
    reputation_experiential = v_exp,
    reputation_safety = v_saf,
    reputation_innovation = v_inn,
    reputation_reliability = v_rel
  WHERE id = user_id_param
  RETURNING is_sme INTO v_new_sme_status;
  
  -- Return results
  RETURN QUERY SELECT 
    user_id_param,
    v_old_reputation,
    v_new_reputation,
    v_old_sme_status,
    v_new_sme_status;
END;
$$ LANGUAGE plpgsql;
