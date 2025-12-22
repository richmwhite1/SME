-- =====================================================
-- Master Topics Table
-- =====================================================
-- Creates the master_topics table with 12 predefined topics
-- =====================================================

CREATE TABLE IF NOT EXISTS master_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add display_order column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'master_topics' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE master_topics ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_master_topics_display_order ON master_topics(display_order);
CREATE INDEX IF NOT EXISTS idx_master_topics_name ON master_topics(name);

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE master_topics DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE master_topics IS 'Master list of predefined topics for tagging';
COMMENT ON COLUMN master_topics.display_order IS 'Order for displaying topics in UI';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the master topics table with 12 predefined topics.
-- =====================================================

