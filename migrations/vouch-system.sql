-- =====================================================
-- VOUCH SYSTEM FOR SME STATUS
-- =====================================================
-- Allows tier 3/4 users to vouch for others to become SMEs

-- 1. Create vouches table
CREATE TABLE IF NOT EXISTS vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_vouch CHECK (voucher_id != target_user_id),
  CONSTRAINT unique_vouch UNIQUE (voucher_id, target_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vouches_voucher_id ON vouches(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vouches_target_user_id ON vouches(target_user_id);
CREATE INDEX IF NOT EXISTS idx_vouches_created_at ON vouches(created_at DESC);

-- Disable RLS
ALTER TABLE vouches DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE vouches IS 'Tracks vouches from tier 3/4 users for SME status promotion';

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS submit_vouch(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_vouch_count(TEXT);
DROP FUNCTION IF EXISTS has_vouched(TEXT, TEXT);

-- 2. Create function to submit a vouch
CREATE OR REPLACE FUNCTION submit_vouch(
  p_voucher_id TEXT,
  p_target_user_id TEXT
) RETURNS TABLE (
  success BOOLEAN,
  vouch_count INTEGER,
  promoted BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_voucher_tier INTEGER;
  v_target_tier INTEGER;
  v_vouch_count INTEGER;
  v_promoted BOOLEAN := false;
BEGIN
  -- Check voucher's tier (must be 3 or 4)
  SELECT reputation_tier INTO v_voucher_tier
  FROM profiles
  WHERE id = p_voucher_id;
  
  IF v_voucher_tier IS NULL OR v_voucher_tier < 3 THEN
    RETURN QUERY SELECT false, 0, false, 'Only SMEs (tier 3+) can vouch for others'::TEXT;
    RETURN;
  END IF;
  
  -- Check target user's tier (must be less than 3)
  SELECT reputation_tier INTO v_target_tier
  FROM profiles
  WHERE id = p_target_user_id;
  
  IF v_target_tier IS NULL THEN
    RETURN QUERY SELECT false, 0, false, 'Target user not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_target_tier >= 3 THEN
    RETURN QUERY SELECT false, 0, false, 'User is already an SME'::TEXT;
    RETURN;
  END IF;
  
  -- Insert the vouch (will fail if already exists due to unique constraint)
  BEGIN
    INSERT INTO vouches (voucher_id, target_user_id)
    VALUES (p_voucher_id, p_target_user_id);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN QUERY SELECT false, 0, false, 'You have already vouched for this user'::TEXT;
      RETURN;
  END;
  
  -- Count total vouches for target user
  SELECT COUNT(*) INTO v_vouch_count
  FROM vouches
  WHERE target_user_id = p_target_user_id;
  
  -- If 3 or more vouches, promote to tier 3
  IF v_vouch_count >= 3 THEN
    UPDATE profiles
    SET 
      reputation_tier = 3,
      is_verified_expert = true,
      updated_at = NOW()
    WHERE id = p_target_user_id;
    
    v_promoted := true;
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    v_vouch_count::INTEGER, 
    v_promoted, 
    CASE 
      WHEN v_promoted THEN 'User promoted to SME status!'
      ELSE 'Vouch submitted successfully'
    END::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION submit_vouch IS 'Submit a vouch for SME status. Auto-promotes at 3 vouches.';

-- 3. Create helper function to get vouch count for a user
CREATE OR REPLACE FUNCTION get_vouch_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM vouches
  WHERE target_user_id = p_user_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_vouch_count IS 'Get the number of vouches a user has received';

-- 4. Create helper function to check if user has vouched
CREATE OR REPLACE FUNCTION has_vouched(p_voucher_id TEXT, p_target_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM vouches
    WHERE voucher_id = p_voucher_id AND target_user_id = p_target_user_id
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION has_vouched IS 'Check if a user has already vouched for another user';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
