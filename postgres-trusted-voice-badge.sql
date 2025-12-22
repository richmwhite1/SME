ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_type TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_badge_type ON profiles(badge_type) WHERE badge_type IS NOT NULL;

CREATE OR REPLACE FUNCTION update_user_badge(user_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_contributor_score INTEGER;
  v_badge_type TEXT;
BEGIN
  SELECT contributor_score INTO v_contributor_score
  FROM profiles
  WHERE id = user_id_param;

  IF v_contributor_score >= 10 THEN
    v_badge_type := 'Trusted Voice';
  ELSE
    v_badge_type := NULL;
  END IF;

  UPDATE profiles
  SET badge_type = v_badge_type
  WHERE id = user_id_param;
END;
$$;

UPDATE profiles
SET badge_type = CASE
  WHEN contributor_score >= 10 THEN 'Trusted Voice'
  ELSE NULL
END
WHERE badge_type IS NULL OR badge_type != CASE
  WHEN contributor_score >= 10 THEN 'Trusted Voice'
  ELSE NULL
END;

COMMENT ON COLUMN profiles.badge_type IS 'Badge type: Trusted Voice for contributors with score >= 10';
COMMENT ON FUNCTION update_user_badge IS 'Updates user badge_type based on contributor_score threshold';

