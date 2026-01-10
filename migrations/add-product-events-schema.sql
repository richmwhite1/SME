-- =====================================================
-- PRODUCT EVENTS TABLE (Analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  visitor_id TEXT, -- Anonymized IP hash or cookie ID for dedup
  metadata JSONB DEFAULT '{}'::jsonb, -- Store referrer, user_agent, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_events_product_id ON product_events(product_id);
CREATE INDEX IF NOT EXISTS idx_product_events_event_type ON product_events(event_type);
CREATE INDEX IF NOT EXISTS idx_product_events_created_at ON product_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_events_dedup ON product_events(product_id, visitor_id, event_type, created_at);

-- Disable RLS
ALTER TABLE product_events DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_events IS 'Analytics events (views, clicks) for products';
COMMENT ON COLUMN product_events.visitor_id IS 'Anonymized identifier for visitor deduplication';
