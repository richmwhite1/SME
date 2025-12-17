-- =====================================================
-- Topic Stats View
-- =====================================================
-- Creates a view showing follower counts for each topic
-- =====================================================

CREATE OR REPLACE VIEW topic_stats AS
SELECT 
  topic_name,
  COUNT(*) AS follower_count
FROM topic_follows
GROUP BY topic_name;

-- Add comment
COMMENT ON VIEW topic_stats IS 'Statistics for topics including follower counts';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the topic stats view.
-- =====================================================

