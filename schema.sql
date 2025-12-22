-- =====================================================
-- HOLISTIC COMMUNITY PROTOCOL DATABASE SCHEMA
-- =====================================================
-- Complete database schema for Railway PostgreSQL
-- Run this file to set up all tables, indexes, and functions
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE (User accounts with Clerk integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  credentials TEXT,
  contributor_score INTEGER DEFAULT 0,
  badge_type TEXT DEFAULT 'Member',
  is_admin BOOLEAN DEFAULT false,
  is_verified_expert BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING GIN (social_links);

-- Disable RLS for Clerk integration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE profiles IS 'User profiles managed by Clerk authentication';
COMMENT ON COLUMN profiles.id IS 'Clerk user ID (text format)';
COMMENT ON COLUMN profiles.username IS 'Unique username for public profile URLs';
COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin/moderator privileges';
COMMENT ON COLUMN profiles.social_links IS 'Social media links stored as JSONB: {discord, telegram, x, instagram}';
COMMENT ON COLUMN profiles.contributor_score IS 'Community contribution score';

-- =====================================================
-- 2. PRODUCTS TABLE (Products/Supplements)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  problem_solved TEXT,
  ai_summary TEXT,
  buy_url TEXT,
  reference_url TEXT,
  images TEXT[],
  tags TEXT[] DEFAULT '{}',
  is_sme_certified BOOLEAN DEFAULT false,
  third_party_lab_verified BOOLEAN DEFAULT false,
  purity_tested BOOLEAN DEFAULT false,
  source_transparency BOOLEAN DEFAULT false,
  potency_verified BOOLEAN DEFAULT false,
  excipient_audit BOOLEAN DEFAULT false,
  operational_legitimacy BOOLEAN DEFAULT false,
  coa_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN(images);
CREATE INDEX IF NOT EXISTS idx_products_is_sme_certified ON products(is_sme_certified) WHERE is_sme_certified = true;

-- Disable RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE products IS 'Products and supplements with SME certification';
COMMENT ON COLUMN products.images IS 'Array of image URLs (up to 10) stored in product-images bucket';
COMMENT ON COLUMN products.is_sme_certified IS 'Whether the product is SME certified (meets all verification criteria)';
COMMENT ON COLUMN products.coa_url IS 'Certificate of Analysis (COA) document URL';

-- =====================================================
-- 3. REVIEWS TABLE (Product reviews)
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  guest_author_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Disable RLS
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reviews IS 'User reviews for products';
COMMENT ON COLUMN reviews.guest_author_name IS 'Display name for guest reviews (when user_id is null)';
COMMENT ON COLUMN reviews.product_id IS 'Reference to the product being reviewed';

-- =====================================================
-- 4. DISCUSSIONS TABLE (Community forum posts)
-- =====================================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  upvote_count INTEGER DEFAULT 0,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_pinned column if it doesn't exist
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_slug ON discussions(slug);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_tags ON discussions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_discussions_upvote_count ON discussions(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_flagged ON discussions(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON discussions(is_pinned) WHERE is_pinned = true;

-- Disable RLS
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE discussions IS 'Community discussions/forum posts';
COMMENT ON COLUMN discussions.upvote_count IS 'Cached count of upvotes for performance';

-- =====================================================
-- 5. DISCUSSION_COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_id ON discussion_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON discussion_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_is_flagged ON discussion_comments(is_flagged) WHERE is_flagged = true;

-- Disable RLS
ALTER TABLE discussion_comments DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE discussion_comments IS 'Comments on discussions';

-- =====================================================
-- 6. PRODUCT_COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_comments_is_flagged ON product_comments(is_flagged) WHERE is_flagged = true;

-- Disable RLS
ALTER TABLE product_comments DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_comments IS 'Comments on products';

-- =====================================================
-- 7. DISCUSSION_VOTES TABLE (Upvote system)
-- =====================================================
CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one vote per user per discussion
  CONSTRAINT unique_user_discussion_vote UNIQUE (user_id, discussion_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discussion_votes_user_id ON discussion_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_discussion_id ON discussion_votes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_created_at ON discussion_votes(created_at DESC);

-- Disable RLS
ALTER TABLE discussion_votes DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE discussion_votes IS 'Upvotes for discussions';

-- =====================================================
-- 7. MASTER_TOPICS TABLE (Predefined topic tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS master_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 12 master topics
INSERT INTO master_topics (name, description, display_order) VALUES
  ('Biohacking', 'Optimizing biology through science and technology', 1),
  ('Longevity', 'Extending healthy lifespan', 2),
  ('Research', 'Scientific studies and evidence', 3),
  ('Supplements', 'Nutritional supplements and vitamins', 4),
  ('Nutrition', 'Diet and food science', 5),
  ('Wellness', 'Holistic health and wellbeing', 6),
  ('Gut Health', 'Digestive system and microbiome', 7),
  ('Mental Health', 'Cognitive and emotional wellbeing', 8),
  ('Fitness', 'Physical exercise and movement', 9),
  ('Sleep', 'Sleep optimization and recovery', 10),
  ('Hormones', 'Hormonal balance and optimization', 11),
  ('Prevention', 'Disease prevention and early intervention', 12)
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_master_topics_display_order ON master_topics(display_order);
CREATE INDEX IF NOT EXISTS idx_master_topics_name ON master_topics(name);

-- Disable RLS
ALTER TABLE master_topics DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE master_topics IS 'Master list of predefined topics for tagging';

-- =====================================================
-- 8. TOPIC_FOLLOWS TABLE (Users following topics)
-- =====================================================
CREATE TABLE IF NOT EXISTS topic_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_topic_follow UNIQUE (user_id, topic_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topic_follows_user_id ON topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_topic_name ON topic_follows(topic_name);
CREATE INDEX IF NOT EXISTS idx_topic_follows_created_at ON topic_follows(created_at DESC);

-- Disable RLS
ALTER TABLE topic_follows DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE topic_follows IS 'Users following specific topics/tags';

-- =====================================================
-- 9. FOLLOWS TABLE (User follower graph)
-- =====================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Cannot follow yourself
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- Unique: Can only follow a user once
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Disable RLS
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE follows IS 'Follower graph: tracks who follows whom';

-- =====================================================
-- 10. MODERATION TABLES
-- =====================================================

-- Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('discussion', 'comment', 'review')),
  content_id UUID NOT NULL,
  reason TEXT,
  flagged_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content_type ON moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at DESC);

ALTER TABLE moderation_queue DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE moderation_queue IS 'Queue of flagged content for moderation';

-- Keyword Blacklist
CREATE TABLE IF NOT EXISTS keyword_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keyword_blacklist_keyword ON keyword_blacklist(keyword);

ALTER TABLE keyword_blacklist DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE keyword_blacklist IS 'Keywords that trigger automatic flagging';

-- Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE admin_logs IS 'Audit trail for admin actions';

-- =====================================================
-- 11. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('upvote', 'comment', 'follow', 'mention', 'reply', 'badge', 'milestone')),
  target_id UUID,
  target_type TEXT CHECK (target_type IN ('discussion', 'comment', 'product', 'profile')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_id, target_type);

-- Disable RLS for Clerk integration
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE notifications IS 'User notifications for activity and engagement';
COMMENT ON COLUMN notifications.type IS 'Type of notification: upvote, comment, follow, mention, reply, badge, milestone';
COMMENT ON COLUMN notifications.target_id IS 'ID of the related content (discussion, comment, etc.)';
COMMENT ON COLUMN notifications.target_type IS 'Type of target: discussion, comment, product, profile';
COMMENT ON COLUMN notifications.metadata IS 'Additional notification data stored as JSON';

-- =====================================================
-- 12. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Toggle discussion vote
CREATE OR REPLACE FUNCTION toggle_discussion_vote(
  p_user_id TEXT,
  p_discussion_id UUID
)
RETURNS TABLE(
  voted BOOLEAN,
  new_count INTEGER
) AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Check if vote already exists
  SELECT EXISTS(
    SELECT 1 FROM discussion_votes
    WHERE user_id = p_user_id AND discussion_id = p_discussion_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove vote
    DELETE FROM discussion_votes
    WHERE user_id = p_user_id AND discussion_id = p_discussion_id;
    
    -- Decrement count
    UPDATE discussions
    SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = p_discussion_id
    RETURNING upvote_count INTO v_new_count;
    
    RETURN QUERY SELECT false, v_new_count;
  ELSE
    -- Add vote
    INSERT INTO discussion_votes (user_id, discussion_id)
    VALUES (p_user_id, p_discussion_id);
    
    -- Increment count
    UPDATE discussions
    SET upvote_count = upvote_count + 1
    WHERE id = p_discussion_id
    RETURNING upvote_count INTO v_new_count;
    
    RETURN QUERY SELECT true, v_new_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION toggle_discussion_vote IS 'Atomically toggle vote and update count';

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update discussions updated_at
DROP TRIGGER IF EXISTS trigger_update_discussions_updated_at ON discussions;
CREATE TRIGGER trigger_update_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update profiles updated_at
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. VIEWS
-- =====================================================

-- Global Feed View (All discussions)
CREATE OR REPLACE VIEW global_feed_view AS
SELECT 
  d.id,
  d.title,
  d.content,
  d.author_id,
  d.slug,
  d.tags,
  d.upvote_count,
  d.flag_count,
  d.is_flagged,
  d.is_pinned,
  d.created_at,
  d.updated_at,
  p.full_name AS author_name,
  p.username AS author_username,
  p.avatar_url AS author_avatar,
  p.badge_type AS author_badge,
  p.is_verified_expert AS author_is_expert,
  (SELECT COUNT(*) FROM discussion_comments WHERE discussion_id = d.id) AS comment_count
FROM discussions d
JOIN profiles p ON d.author_id = p.id
WHERE d.is_flagged = false
ORDER BY d.created_at DESC;

COMMENT ON VIEW global_feed_view IS 'Global feed of all discussions with author info';

-- Trusted Feed View (From verified experts)
CREATE OR REPLACE VIEW trusted_feed_view AS
SELECT 
  d.id,
  d.title,
  d.content,
  d.author_id,
  d.slug,
  d.tags,
  d.upvote_count,
  d.created_at,
  d.updated_at,
  p.full_name AS author_name,
  p.username AS author_username,
  p.avatar_url AS author_avatar,
  p.badge_type AS author_badge,
  (SELECT COUNT(*) FROM discussion_comments WHERE discussion_id = d.id) AS comment_count
FROM discussions d
JOIN profiles p ON d.author_id = p.id
WHERE p.is_verified_expert = true
  AND d.is_flagged = false
ORDER BY d.created_at DESC;

COMMENT ON VIEW trusted_feed_view IS 'Feed of discussions from verified experts only';

-- =====================================================
-- 14. GLOBAL SEARCH FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION global_search(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  title TEXT,
  content TEXT,
  author_name TEXT,
  created_at TIMESTAMPTZ,
  url_slug TEXT,
  tags TEXT[],
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  
  -- Search Discussions
  SELECT 
    'discussion'::TEXT AS result_type,
    d.id AS result_id,
    d.title,
    d.content,
    p.full_name AS author_name,
    d.created_at,
    d.slug AS url_slug,
    d.tags,
    ts_rank(
      to_tsvector('english', d.title || ' ' || d.content),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM discussions d
  JOIN profiles p ON d.author_id = p.id
  WHERE 
    to_tsvector('english', d.title || ' ' || d.content) @@ plainto_tsquery('english', search_query)
    AND d.is_flagged = false
  
  UNION ALL
  
  -- Search Products
  SELECT 
    'product'::TEXT AS result_type,
    pr.id AS result_id,
    pr.title,
    COALESCE(pr.problem_solved, pr.ai_summary, '') AS content,
    NULL::TEXT AS author_name,
    pr.created_at,
    pr.slug AS url_slug,
    NULL::TEXT[] AS tags,
    ts_rank(
      to_tsvector('english', pr.title || ' ' || COALESCE(pr.problem_solved, '') || ' ' || COALESCE(pr.ai_summary, '')),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM products pr
  WHERE 
    to_tsvector('english', pr.title || ' ' || COALESCE(pr.problem_solved, '') || ' ' || COALESCE(pr.ai_summary, '')) 
    @@ plainto_tsquery('english', search_query)
  
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION global_search IS 'Full-text search across discussions and products';

-- =====================================================
-- 15. TRENDING TOPICS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_trending_topics(
  days_back INTEGER DEFAULT 7,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  topic_name TEXT,
  discussion_count BIGINT,
  follower_count BIGINT,
  total_engagement BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_discussions AS (
    SELECT 
      UNNEST(tags) AS topic,
      COUNT(*) AS disc_count
    FROM discussions
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY topic
  ),
  topic_followers AS (
    SELECT 
      topic_name AS topic,
      COUNT(*) AS follow_count
    FROM topic_follows
    GROUP BY topic_name
  )
  SELECT 
    COALESCE(td.topic, tf.topic) AS topic_name,
    COALESCE(td.disc_count, 0) AS discussion_count,
    COALESCE(tf.follow_count, 0) AS follower_count,
    COALESCE(td.disc_count, 0) + COALESCE(tf.follow_count, 0) AS total_engagement
  FROM topic_discussions td
  FULL OUTER JOIN topic_followers tf ON td.topic = tf.topic
  ORDER BY total_engagement DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_trending_topics IS 'Get trending topics based on recent activity and followers';

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- All tables, indexes, functions, and views have been created
-- Railway PostgreSQL database is ready for production use
-- =====================================================

