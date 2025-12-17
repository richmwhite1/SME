-- =====================================================
-- Rename Healer Score to Contributor Score
-- =====================================================
-- This renames the healer_score column to contributor_score
-- =====================================================

-- Rename the column
ALTER TABLE profiles RENAME COLUMN healer_score TO contributor_score;

-- Update the Postgres function to use contributor_score
CREATE OR REPLACE FUNCTION mark_review_helpful(
  p_review_id UUID,
  p_user_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_review_author_id TEXT;
  v_already_voted BOOLEAN;
BEGIN
  -- Check if user already voted
  SELECT EXISTS(
    SELECT 1 FROM helpful_votes 
    WHERE review_id = p_review_id AND user_id = p_user_id
  ) INTO v_already_voted;

  -- If already voted, return early
  IF v_already_voted THEN
    RETURN json_build_object('success', false, 'message', 'Already voted');
  END IF;

  -- Get the review author's user_id
  SELECT user_id INTO v_review_author_id
  FROM reviews
  WHERE id = p_review_id;

  -- If review doesn't exist, return error
  IF v_review_author_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Review not found');
  END IF;

  -- Atomic transaction: Insert vote, increment review count, increment contributor score
  
  -- 1. Insert into helpful_votes
  INSERT INTO helpful_votes (review_id, user_id)
  VALUES (p_review_id, p_user_id);

  -- 2. Increment helpful_count on the review
  UPDATE reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = p_review_id;

  -- 3. Increment contributor_score for the review author
  UPDATE profiles
  SET contributor_score = COALESCE(contributor_score, 0) + 1
  WHERE id = v_review_author_id;

  -- Return success
  RETURN json_build_object('success', true, 'message', 'Vote recorded');
END;
$$;

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to rename
-- healer_score to contributor_score throughout the database.
-- =====================================================


