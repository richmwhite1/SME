-- =====================================================
-- Invite Sent Tracking for Protocols Table
-- =====================================================
-- Adds invite_sent column to track which brands have been contacted
-- =====================================================

-- Add invite_sent boolean column
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS invite_sent BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_protocols_invite_sent ON protocols(invite_sent) WHERE invite_sent = true;

-- Add comment
COMMENT ON COLUMN protocols.invite_sent IS 'Whether a certification invitation email has been sent to the brand';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- the invite_sent tracking column.
-- =====================================================




