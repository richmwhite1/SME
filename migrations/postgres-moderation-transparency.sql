-- =====================================================
-- MODERATION TRANSPARENCY & APPEALS SYSTEM
-- =====================================================
-- Public moderation metrics for transparency
-- Appeal system for flagged content
-- Moderation performance tracking
-- =====================================================

-- =====================================================
-- 1. MODERATION_METRICS TABLE (Aggregate statistics)
-- =====================================================
CREATE TABLE IF NOT EXISTS moderation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_flags INTEGER DEFAULT 0,
  total_resolved INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  avg_resolution_time_hours NUMERIC(10,2),
  community_flags INTEGER DEFAULT 0,
  ai_flags INTEGER DEFAULT 0,
  appeals_submitted INTEGER DEFAULT 0,
  appeals_approved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per date
  CONSTRAINT unique_metric_date UNIQUE (metric_date)
);

CREATE INDEX IF NOT EXISTS idx_moderation_metrics_date ON moderation_metrics(metric_date DESC);

ALTER TABLE moderation_metrics DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE moderation_metrics IS 'Daily aggregated moderation statistics for transparency';

-- =====================================================
-- 2. APPEAL_REQUESTS TABLE (Content moderation appeals)
-- =====================================================
CREATE TABLE IF NOT EXISTS appeal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('discussion', 'discussion_comment', 'product_comment', 'review')),
  content_id UUID NOT NULL,
  appellant_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appeal_requests_status ON appeal_requests(status);
CREATE INDEX IF NOT EXISTS idx_appeal_requests_appellant_id ON appeal_requests(appellant_id);
CREATE INDEX IF NOT EXISTS idx_appeal_requests_created_at ON appeal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appeal_requests_content ON appeal_requests(content_type, content_id);

ALTER TABLE appeal_requests DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE appeal_requests IS 'User appeals for flagged or removed content';
COMMENT ON COLUMN appeal_requests.reason IS 'User explanation for why content should be restored';

-- =====================================================
-- 3. FUNCTIONS FOR MODERATION METRICS
-- =====================================================

-- Function: Get current moderation metrics (last 30 days)
CREATE OR REPLACE FUNCTION get_moderation_metrics_summary()
RETURNS TABLE(
  total_flags_30d BIGINT,
  total_resolved_30d BIGINT,
  avg_resolution_hours NUMERIC,
  approval_rate NUMERIC,
  community_flag_ratio NUMERIC,
  appeals_submitted_30d BIGINT,
  appeals_approval_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(total_flags), 0)::BIGINT AS total_flags_30d,
    COALESCE(SUM(total_resolved), 0)::BIGINT AS total_resolved_30d,
    ROUND(AVG(avg_resolution_time_hours), 2) AS avg_resolution_hours,
    CASE 
      WHEN SUM(total_resolved) > 0 THEN
        ROUND((SUM(total_approved)::NUMERIC / SUM(total_resolved)::NUMERIC * 100), 2)
      ELSE 0
    END AS approval_rate,
    CASE 
      WHEN SUM(total_flags) > 0 THEN
        ROUND((SUM(community_flags)::NUMERIC / SUM(total_flags)::NUMERIC * 100), 2)
      ELSE 0
    END AS community_flag_ratio,
    COALESCE(SUM(appeals_submitted), 0)::BIGINT AS appeals_submitted_30d,
    CASE 
      WHEN SUM(appeals_submitted) > 0 THEN
        ROUND((SUM(appeals_approved)::NUMERIC / SUM(appeals_submitted)::NUMERIC * 100), 2)
      ELSE 0
    END AS appeals_approval_rate
  FROM moderation_metrics
  WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_moderation_metrics_summary IS 'Get 30-day moderation metrics summary for transparency page';

-- Function: Update daily moderation metrics
CREATE OR REPLACE FUNCTION update_moderation_metrics()
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_total_flags INTEGER;
  v_total_resolved INTEGER;
  v_total_approved INTEGER;
  v_total_rejected INTEGER;
  v_avg_resolution_hours NUMERIC;
  v_community_flags INTEGER;
  v_ai_flags INTEGER;
  v_appeals_submitted INTEGER;
  v_appeals_approved INTEGER;
BEGIN
  -- Count flags from moderation_queue created today
  SELECT COUNT(*) INTO v_total_flags
  FROM moderation_queue
  WHERE DATE(created_at) = v_today;
  
  -- Count resolved flags
  SELECT COUNT(*) INTO v_total_resolved
  FROM moderation_queue
  WHERE DATE(reviewed_at) = v_today
    AND status IN ('approved', 'rejected');
  
  -- Count approved
  SELECT COUNT(*) INTO v_total_approved
  FROM moderation_queue
  WHERE DATE(reviewed_at) = v_today
    AND status = 'approved';
  
  -- Count rejected
  SELECT COUNT(*) INTO v_total_rejected
  FROM moderation_queue
  WHERE DATE(reviewed_at) = v_today
    AND status = 'rejected';
  
  -- Calculate average resolution time
  SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) INTO v_avg_resolution_hours
  FROM moderation_queue
  WHERE DATE(reviewed_at) = v_today
    AND status IN ('approved', 'rejected');
  
  -- Count community vs AI flags (assuming flagged_by NULL means AI)
  SELECT COUNT(*) INTO v_community_flags
  FROM moderation_queue
  WHERE DATE(created_at) = v_today
    AND flagged_by IS NOT NULL;
  
  SELECT COUNT(*) INTO v_ai_flags
  FROM moderation_queue
  WHERE DATE(created_at) = v_today
    AND flagged_by IS NULL;
  
  -- Count appeals
  SELECT COUNT(*) INTO v_appeals_submitted
  FROM appeal_requests
  WHERE DATE(created_at) = v_today;
  
  SELECT COUNT(*) INTO v_appeals_approved
  FROM appeal_requests
  WHERE DATE(reviewed_at) = v_today
    AND status = 'approved';
  
  -- Insert or update metrics
  INSERT INTO moderation_metrics (
    metric_date,
    total_flags,
    total_resolved,
    total_approved,
    total_rejected,
    avg_resolution_time_hours,
    community_flags,
    ai_flags,
    appeals_submitted,
    appeals_approved
  ) VALUES (
    v_today,
    v_total_flags,
    v_total_resolved,
    v_total_approved,
    v_total_rejected,
    v_avg_resolution_hours,
    v_community_flags,
    v_ai_flags,
    v_appeals_submitted,
    v_appeals_approved
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_flags = EXCLUDED.total_flags,
    total_resolved = EXCLUDED.total_resolved,
    total_approved = EXCLUDED.total_approved,
    total_rejected = EXCLUDED.total_rejected,
    avg_resolution_time_hours = EXCLUDED.avg_resolution_time_hours,
    community_flags = EXCLUDED.community_flags,
    ai_flags = EXCLUDED.ai_flags,
    appeals_submitted = EXCLUDED.appeals_submitted,
    appeals_approved = EXCLUDED.appeals_approved;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_moderation_metrics IS 'Update daily moderation metrics (run via cron job)';

-- Function: Submit appeal for flagged content
CREATE OR REPLACE FUNCTION submit_content_appeal(
  p_content_type TEXT,
  p_content_id UUID,
  p_appellant_id TEXT,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_appeal_id UUID;
BEGIN
  -- Check if content is actually flagged
  IF p_content_type = 'discussion' THEN
    IF NOT EXISTS (SELECT 1 FROM discussions WHERE id = p_content_id AND is_flagged = true) THEN
      RAISE EXCEPTION 'Content is not flagged';
    END IF;
  ELSIF p_content_type = 'discussion_comment' THEN
    IF NOT EXISTS (SELECT 1 FROM discussion_comments WHERE id = p_content_id AND is_flagged = true) THEN
      RAISE EXCEPTION 'Content is not flagged';
    END IF;
  ELSIF p_content_type = 'product_comment' THEN
    IF NOT EXISTS (SELECT 1 FROM product_comments WHERE id = p_content_id AND is_flagged = true) THEN
      RAISE EXCEPTION 'Content is not flagged';
    END IF;
  ELSIF p_content_type = 'review' THEN
    IF NOT EXISTS (SELECT 1 FROM reviews WHERE id = p_content_id AND is_flagged = true) THEN
      RAISE EXCEPTION 'Content is not flagged';
    END IF;
  END IF;
  
  -- Check if appeal already exists
  IF EXISTS (
    SELECT 1 FROM appeal_requests 
    WHERE content_type = p_content_type 
      AND content_id = p_content_id 
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Appeal already pending for this content';
  END IF;
  
  -- Create appeal
  INSERT INTO appeal_requests (content_type, content_id, appellant_id, reason)
  VALUES (p_content_type, p_content_id, p_appellant_id, p_reason)
  RETURNING id INTO v_appeal_id;
  
  RETURN v_appeal_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION submit_content_appeal IS 'Submit an appeal for flagged content';

-- =====================================================
-- 4. INITIALIZE METRICS FOR PAST 30 DAYS
-- =====================================================

-- Backfill metrics for the past 30 days
DO $$
DECLARE
  v_date DATE;
BEGIN
  FOR v_date IN 
    SELECT generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day'::INTERVAL)::DATE
  LOOP
    INSERT INTO moderation_metrics (metric_date, total_flags, total_resolved)
    VALUES (v_date, 0, 0)
    ON CONFLICT (metric_date) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Moderation transparency system is now active
-- Metrics can be queried for public display
-- Appeal system is ready for user submissions
-- =====================================================
