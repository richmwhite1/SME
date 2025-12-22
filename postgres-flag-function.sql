-- Optional: Create a function to increment flag_count atomically
-- This is optional - the flagReview action will work with a direct UPDATE as well

CREATE OR REPLACE FUNCTION increment_flag_count(p_review_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reviews
  SET flag_count = COALESCE(flag_count, 0) + 1
  WHERE id = p_review_id;
END;
$$;



