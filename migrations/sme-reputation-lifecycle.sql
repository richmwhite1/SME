-- =====================================================
-- SME REPUTATION LIFECYCLE SYSTEM
-- =====================================================
-- Automated promotion/demotion based on reputation score
-- Implements the "Rubber Glove Rule" - immediate revocation below threshold

-- 1. Add is_sme column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_sme BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_sme ON profiles(is_sme) WHERE is_sme = true;

COMMENT ON COLUMN profiles.is_sme IS 'Automatically managed SME status based on reputation_score >= 100';

-- 2. Create function to calculate user reputation from all upvotes
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
  total_reputation INTEGER := 0;
  discussion_vote_count INTEGER := 0;
  discussion_comment_vote_count INTEGER := 0;
  product_comment_vote_count INTEGER := 0;
BEGIN
  -- Count upvotes on user's discussions
  SELECT COALESCE(SUM(d.upvote_count), 0) INTO discussion_vote_count
  FROM discussions d
  WHERE d.author_id = user_id_param;
  
  -- Count upvotes on user's discussion comments
  SELECT COALESCE(SUM(dc.upvote_count), 0) INTO discussion_comment_vote_count
  FROM discussion_comments dc
  WHERE dc.author_id = user_id_param;
  
  -- Count upvotes on user's product comments
  SELECT COALESCE(SUM(pc.upvote_count), 0) INTO product_comment_vote_count
  FROM product_comments pc
  WHERE pc.user_id = user_id_param;
  
  -- Calculate total reputation
  total_reputation := discussion_vote_count + discussion_comment_vote_count + product_comment_vote_count;
  
  RETURN total_reputation;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_user_reputation IS 'Calculate total reputation from upvotes across all user content';

-- 3. Create trigger function to sync is_sme status based on reputation_score
CREATE OR REPLACE FUNCTION sync_sme_status()
RETURNS TRIGGER AS $$
DECLARE
  old_sme_status BOOLEAN;
  new_sme_status BOOLEAN;
BEGIN
  -- Store old status
  old_sme_status := OLD.is_sme;
  
  -- Calculate new status based on reputation threshold
  new_sme_status := (NEW.reputation_score >= 100);
  
  -- Update is_sme if it changed
  IF new_sme_status != old_sme_status THEN
    NEW.is_sme := new_sme_status;
    
    -- Log the status change
    RAISE NOTICE 'SME status changed for user %: % -> % (reputation: %)', 
      NEW.id, old_sme_status, new_sme_status, NEW.reputation_score;
    
    -- Insert into admin_logs for audit trail
    INSERT INTO admin_logs (admin_id, action, details)
    VALUES (
      NEW.id,
      CASE 
        WHEN new_sme_status THEN 'sme_promoted'
        ELSE 'sme_demoted'
      END,
      jsonb_build_object(
        'user_id', NEW.id,
        'reputation_score', NEW.reputation_score,
        'old_status', old_sme_status,
        'new_status', new_sme_status,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_sme_status IS 'Automatically sync is_sme status when reputation_score changes';

-- 4. Attach trigger to profiles table
DROP TRIGGER IF EXISTS trigger_sync_sme_status ON profiles;
CREATE TRIGGER trigger_sync_sme_status
  BEFORE UPDATE OF reputation_score ON profiles
  FOR EACH ROW
  WHEN (OLD.reputation_score IS DISTINCT FROM NEW.reputation_score)
  EXECUTE FUNCTION sync_sme_status();

-- 5. Create function to recalculate and update user reputation
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
BEGIN
  -- Get current values
  SELECT reputation_score, is_sme INTO v_old_reputation, v_old_sme_status
  FROM profiles
  WHERE id = user_id_param;
  
  -- Calculate new reputation
  v_new_reputation := calculate_user_reputation(user_id_param);
  
  -- Update reputation score (trigger will handle is_sme update)
  UPDATE profiles
  SET reputation_score = v_new_reputation
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

COMMENT ON FUNCTION recalculate_and_update_reputation IS 'Recalculate user reputation from upvotes and update profile';

-- 6. Create trigger function to update author reputation when votes change
CREATE OR REPLACE FUNCTION update_author_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  author_user_id TEXT;
BEGIN
  -- Determine author based on table
  IF TG_TABLE_NAME = 'discussion_votes' THEN
    -- Get discussion author
    SELECT author_id INTO author_user_id
    FROM discussions
    WHERE id = COALESCE(NEW.discussion_id, OLD.discussion_id);
    
  ELSIF TG_TABLE_NAME = 'comment_votes' THEN
    -- Get comment author based on comment type
    IF COALESCE(NEW.comment_type, OLD.comment_type) = 'discussion' THEN
      SELECT author_id INTO author_user_id
      FROM discussion_comments
      WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
      
    ELSIF COALESCE(NEW.comment_type, OLD.comment_type) = 'product' THEN
      SELECT user_id INTO author_user_id
      FROM product_comments
      WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    END IF;
  END IF;
  
  -- Recalculate author's reputation if found
  IF author_user_id IS NOT NULL THEN
    PERFORM recalculate_and_update_reputation(author_user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_author_reputation_on_vote IS 'Update author reputation when votes are added or removed';

-- 7. Attach triggers to vote tables
DROP TRIGGER IF EXISTS trigger_update_reputation_on_discussion_vote ON discussion_votes;
CREATE TRIGGER trigger_update_reputation_on_discussion_vote
  AFTER INSERT OR DELETE ON discussion_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_author_reputation_on_vote();

DROP TRIGGER IF EXISTS trigger_update_reputation_on_comment_vote ON comment_votes;
CREATE TRIGGER trigger_update_reputation_on_comment_vote
  AFTER INSERT OR DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_author_reputation_on_vote();

-- 8. Initialize is_sme status for existing users based on current reputation_score
UPDATE profiles
SET is_sme = (reputation_score >= 100)
WHERE is_sme IS DISTINCT FROM (reputation_score >= 100);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- SME Reputation Lifecycle system is now active
-- Users with reputation_score >= 100 will automatically have is_sme = true
-- Users below threshold will have is_sme = false
-- Status updates automatically when reputation changes
-- =====================================================
