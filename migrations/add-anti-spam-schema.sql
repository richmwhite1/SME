-- =====================================================
-- ANTI-SPAM DEFENSE SYSTEM SCHEMA
-- =====================================================

-- 1. Add moderation columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS messaging_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS messaging_disabled_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS allows_guest_messages BOOLEAN DEFAULT true;

-- Index for quick lookup of banned users
CREATE INDEX IF NOT EXISTS idx_profiles_messaging_banned ON profiles(messaging_banned) WHERE messaging_banned = true;

-- 2. Create spam_reports table
CREATE TABLE IF NOT EXISTS spam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reports from same user
  CONSTRAINT unique_report_pair UNIQUE (reporter_id, reported_id)
);

CREATE INDEX IF NOT EXISTS idx_spam_reports_reported_id ON spam_reports(reported_id);

-- 3. Create function to count reports and auto-ban
CREATE OR REPLACE FUNCTION check_spam_reports_threshold()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count distinct reporters for the reported user
  SELECT COUNT(DISTINCT reporter_id) INTO report_count
  FROM spam_reports
  WHERE reported_id = NEW.reported_id;
  
  -- If 3 or more reports, auto-ban messaging
  IF report_count >= 3 THEN
    UPDATE profiles
    SET 
        messaging_banned = true,
        messaging_disabled_until = NOW() + INTERVAL '7 days' -- 1 week suspension initially
    WHERE id = NEW.reported_id AND messaging_banned = false;
    
    RAISE NOTICE 'User % auto-banned from messaging due to % spam reports', NEW.reported_id, report_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for auto-ban
DROP TRIGGER IF EXISTS trigger_check_spam_reports ON spam_reports;
CREATE TRIGGER trigger_check_spam_reports
  AFTER INSERT ON spam_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_spam_reports_threshold();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
