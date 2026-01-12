-- =====================================================
-- BADGES & GAMIFICATION SYSTEM
-- =====================================================
-- Comprehensive badge system with automatic awarding
-- Reputation tiers (Bronze, Silver, Gold, Platinum)
-- Achievement tracking and progress monitoring
-- =====================================================

-- =====================================================
-- 1. BADGES TABLE (Master list of all badges)
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('contribution', 'engagement', 'expertise', 'milestone', 'special')),
  icon TEXT, -- Icon name or emoji
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  criteria JSONB NOT NULL, -- JSON object defining earning criteria
  points_required INTEGER, -- For reputation-based badges
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active) WHERE is_active = true;

ALTER TABLE badges DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE badges IS 'Master list of all available badges in the system';
COMMENT ON COLUMN badges.criteria IS 'JSON criteria for earning badge, e.g. {"type": "upvotes_received", "threshold": 100}';

-- =====================================================
-- 2. USER_BADGES TABLE (Track earned badges)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- Current progress toward badge (if applicable)
  
  -- Unique constraint: one badge per user
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE user_badges IS 'Tracks which badges users have earned';

-- =====================================================
-- 3. REPUTATION_TIERS TABLE (Bronze/Silver/Gold/Platinum)
-- =====================================================
CREATE TABLE IF NOT EXISTS reputation_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  min_reputation INTEGER NOT NULL,
  max_reputation INTEGER,
  color TEXT, -- Hex color for tier badge
  benefits JSONB DEFAULT '[]'::jsonb, -- Array of benefits
  display_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reputation_tiers_min_reputation ON reputation_tiers(min_reputation);

ALTER TABLE reputation_tiers DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reputation_tiers IS 'Reputation tier definitions (Bronze, Silver, Gold, Platinum)';

-- Insert default tiers
INSERT INTO reputation_tiers (name, min_reputation, max_reputation, color, benefits, display_order) VALUES
  ('Member', 0, 49, '#94a3b8', '["Access to discussions", "Can upvote content", "Can comment on products"]'::jsonb, 1),
  ('Bronze', 50, 99, '#cd7f32', '["All Member benefits", "Reduced moderation", "Profile badge"]'::jsonb, 2),
  ('Silver', 100, 499, '#c0c0c0', '["All Bronze benefits", "SME status", "Priority in feeds", "Can review products"]'::jsonb, 3),
  ('Gold', 500, 999, '#ffd700', '["All Silver benefits", "Verified expert badge", "Moderation privileges", "Featured content"]'::jsonb, 4),
  ('Platinum', 1000, NULL, '#e5e4e2', '["All Gold benefits", "Platform influence", "Early access to features", "Custom profile themes"]'::jsonb, 5)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. SEED INITIAL BADGES
-- =====================================================

INSERT INTO badges (name, description, category, icon, rarity, criteria) VALUES
  -- Contribution Badges
  ('First Post', 'Created your first discussion', 'contribution', '🎯', 'common', '{"type": "discussions_created", "threshold": 1}'::jsonb),
  ('Conversationalist', 'Created 10 discussions', 'contribution', '💬', 'rare', '{"type": "discussions_created", "threshold": 10}'::jsonb),
  ('Discussion Leader', 'Created 50 discussions', 'contribution', '👑', 'epic', '{"type": "discussions_created", "threshold": 50}'::jsonb),
  ('First Comment', 'Posted your first comment', 'contribution', '✍️', 'common', '{"type": "comments_posted", "threshold": 1}'::jsonb),
  ('Active Contributor', 'Posted 100 comments', 'contribution', '🔥', 'rare', '{"type": "comments_posted", "threshold": 100}'::jsonb),
  ('Prolific Commenter', 'Posted 500 comments', 'contribution', '⚡', 'epic', '{"type": "comments_posted", "threshold": 500}'::jsonb),
  
  -- Engagement Badges
  ('Helpful', 'Received 10 upvotes', 'engagement', '👍', 'common', '{"type": "upvotes_received", "threshold": 10}'::jsonb),
  ('Valued Voice', 'Received 100 upvotes', 'engagement', '⭐', 'rare', '{"type": "upvotes_received", "threshold": 100}'::jsonb),
  ('Community Champion', 'Received 500 upvotes', 'engagement', '🏆', 'epic', '{"type": "upvotes_received", "threshold": 500}'::jsonb),
  ('Influencer', 'Received 1000 upvotes', 'engagement', '💎', 'legendary', '{"type": "upvotes_received", "threshold": 1000}'::jsonb),
  
  -- Expertise Badges
  ('Product Reviewer', 'Reviewed your first product', 'expertise', '📝', 'common', '{"type": "product_reviews", "threshold": 1}'::jsonb),
  ('Expert Reviewer', 'Reviewed 10 products', 'expertise', '🔬', 'rare', '{"type": "product_reviews", "threshold": 10}'::jsonb),
  ('Master Reviewer', 'Reviewed 50 products', 'expertise', '🎓', 'epic', '{"type": "product_reviews", "threshold": 50}'::jsonb),
  
  -- Milestone Badges
  ('Early Adopter', 'Joined in the first month', 'milestone', '🚀', 'rare', '{"type": "early_adopter", "threshold": 1}'::jsonb),
  ('One Year Anniversary', 'Active for one year', 'milestone', '🎂', 'epic', '{"type": "account_age_days", "threshold": 365}'::jsonb),
  
  -- Special Badges
  ('Verified Expert', 'Verified by admin as domain expert', 'special', '✅', 'legendary', '{"type": "manual_award", "threshold": 1}'::jsonb),
  ('Top Contributor', 'Top 10 contributor this month', 'special', '🌟', 'legendary', '{"type": "manual_award", "threshold": 1}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. FUNCTIONS FOR BADGE AWARDING
-- =====================================================

-- Function: Get user's current reputation tier
CREATE OR REPLACE FUNCTION get_user_reputation_tier(user_id_param TEXT)
RETURNS TABLE(
  tier_name TEXT,
  tier_color TEXT,
  current_reputation INTEGER,
  next_tier_name TEXT,
  next_tier_threshold INTEGER,
  progress_percentage NUMERIC
) AS $$
DECLARE
  v_reputation INTEGER;
  v_current_tier RECORD;
  v_next_tier RECORD;
BEGIN
  -- Get user's current reputation
  SELECT contributor_score INTO v_reputation
  FROM profiles
  WHERE id = user_id_param;
  
  -- Get current tier
  SELECT * INTO v_current_tier
  FROM reputation_tiers
  WHERE min_reputation <= v_reputation
    AND (max_reputation IS NULL OR max_reputation >= v_reputation)
  ORDER BY min_reputation DESC
  LIMIT 1;
  
  -- Get next tier
  SELECT * INTO v_next_tier
  FROM reputation_tiers
  WHERE min_reputation > v_reputation
  ORDER BY min_reputation ASC
  LIMIT 1;
  
  -- Calculate progress percentage
  RETURN QUERY SELECT
    v_current_tier.name,
    v_current_tier.color,
    v_reputation,
    v_next_tier.name,
    v_next_tier.min_reputation,
    CASE 
      WHEN v_next_tier.min_reputation IS NOT NULL THEN
        ROUND(((v_reputation - v_current_tier.min_reputation)::NUMERIC / 
               (v_next_tier.min_reputation - v_current_tier.min_reputation)::NUMERIC * 100), 2)
      ELSE 100.0
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_reputation_tier IS 'Get user''s current tier and progress to next tier';

-- Function: Check and award badges based on user activity
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id_param TEXT)
RETURNS TABLE(
  newly_awarded_badges UUID[]
) AS $$
DECLARE
  v_discussions_count INTEGER;
  v_comments_count INTEGER;
  v_upvotes_received INTEGER;
  v_product_reviews_count INTEGER;
  v_account_age_days INTEGER;
  v_badge RECORD;
  v_awarded_badges UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Get user statistics
  SELECT COUNT(*) INTO v_discussions_count
  FROM discussions
  WHERE author_id = user_id_param;
  
  SELECT COUNT(*) INTO v_comments_count
  FROM (
    SELECT id FROM discussion_comments WHERE author_id = user_id_param
    UNION ALL
    SELECT id FROM product_comments WHERE user_id = user_id_param
  ) AS all_comments;
  
  SELECT contributor_score INTO v_upvotes_received
  FROM profiles
  WHERE id = user_id_param;
  
  SELECT COUNT(*) INTO v_product_reviews_count
  FROM reviews
  WHERE user_id = user_id_param;
  
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER INTO v_account_age_days
  FROM profiles
  WHERE id = user_id_param;
  
  -- Check each badge criteria
  FOR v_badge IN SELECT * FROM badges WHERE is_active = true LOOP
    -- Skip if user already has this badge
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_id = v_badge.id) THEN
      CONTINUE;
    END IF;
    
    -- Check criteria based on type
    IF v_badge.criteria->>'type' = 'discussions_created' AND 
       v_discussions_count >= (v_badge.criteria->>'threshold')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, v_badge.id);
      v_awarded_badges := array_append(v_awarded_badges, v_badge.id);
      
    ELSIF v_badge.criteria->>'type' = 'comments_posted' AND 
          v_comments_count >= (v_badge.criteria->>'threshold')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, v_badge.id);
      v_awarded_badges := array_append(v_awarded_badges, v_badge.id);
      
    ELSIF v_badge.criteria->>'type' = 'upvotes_received' AND 
          v_upvotes_received >= (v_badge.criteria->>'threshold')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, v_badge.id);
      v_awarded_badges := array_append(v_awarded_badges, v_badge.id);
      
    ELSIF v_badge.criteria->>'type' = 'product_reviews' AND 
          v_product_reviews_count >= (v_badge.criteria->>'threshold')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, v_badge.id);
      v_awarded_badges := array_append(v_awarded_badges, v_badge.id);
      
    ELSIF v_badge.criteria->>'type' = 'account_age_days' AND 
          v_account_age_days >= (v_badge.criteria->>'threshold')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, v_badge.id);
      v_awarded_badges := array_append(v_awarded_badges, v_badge.id);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_awarded_badges;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_award_badges IS 'Check all badge criteria and award eligible badges to user';

-- =====================================================
-- 6. TRIGGER TO AUTO-CHECK BADGES ON REPUTATION UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_badge_check_on_reputation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if reputation actually changed
  IF OLD.contributor_score IS DISTINCT FROM NEW.contributor_score THEN
    PERFORM check_and_award_badges(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_check_badges_on_reputation ON profiles;
CREATE TRIGGER auto_check_badges_on_reputation
  AFTER UPDATE OF contributor_score ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_badge_check_on_reputation_update();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Badges and gamification system is now active
-- Users will automatically earn badges based on activity
-- Reputation tiers are defined and queryable
-- =====================================================
