-- =====================================================
-- Flagging System with Auto-Hide
-- =====================================================
-- Adds is_flagged column and creates a function to
-- automatically hide reviews when they reach 3 flags
-- =====================================================

-- Add is_flagged column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged ON reviews(is_flagged);

-- Add comment
COMMENT ON COLUMN reviews.is_flagged IS 'Whether the review has been flagged/hidden (auto-set when flag_count >= 3)';

-- =====================================================
-- Function: Flag review and auto-hide at 3 flags
-- =====================================================

CREATE OR REPLACE FUNCTION flag_review_and_auto_hide(p_review_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_flag_count INT;
BEGIN
  -- Increment flag_count
  UPDATE reviews
  SET flag_count = COALESCE(flag_count, 0) + 1
  WHERE id = p_review_id
  RETURNING flag_count INTO v_new_flag_count;

  -- If no review found, return error
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Review not found');
  END IF;

  -- Auto-hide if flag count reaches 3
  IF v_new_flag_count >= 3 THEN
    UPDATE reviews
    SET is_flagged = true
    WHERE id = p_review_id;
    
    RETURN json_build_object(
      'success', true, 
      'message', 'Review flagged and hidden',
      'flag_count', v_new_flag_count,
      'is_flagged', true
    );
  ELSE
    RETURN json_build_object(
      'success', true, 
      'message', 'Review flagged',
      'flag_count', v_new_flag_count,
      'is_flagged', false
    );
  END IF;
END;
$$;

-- Add comment
COMMENT ON FUNCTION flag_review_and_auto_hide IS 'Increments flag_count and auto-hides review when it reaches 3 flags';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to enable
-- the auto-hide flagging system.
-- =====================================================


