-- =====================================================
-- Evidence Submissions Table
-- =====================================================
-- Creates the evidence_submissions table for COA and Lab Report submissions
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  submitted_by TEXT NOT NULL,
  lab_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'image')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  is_confirmed BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_product_id ON evidence_submissions(product_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_submitted_by ON evidence_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_status ON evidence_submissions(status);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_verified ON evidence_submissions(product_id, status) WHERE status = 'verified';

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE evidence_submissions DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE evidence_submissions IS 'COA and Lab Report submissions for product verification';
COMMENT ON COLUMN evidence_submissions.status IS 'Submission status: pending (awaiting verification), verified (approved), rejected (denied)';
COMMENT ON COLUMN evidence_submissions.document_type IS 'Type of document: pdf or image';
COMMENT ON COLUMN evidence_submissions.is_confirmed IS 'User confirmed the document is genuine';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the evidence submissions table.
-- =====================================================



