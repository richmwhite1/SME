-- Add flag_count column to reviews table for the flagging system
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;



