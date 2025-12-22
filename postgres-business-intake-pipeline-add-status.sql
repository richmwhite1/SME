-- =====================================================
-- Business Intake Pipeline - Add Status Columns
-- =====================================================
-- Alternative script: Adds status columns to existing tables
-- Use this if you want to preserve existing data
-- =====================================================

-- Add status column to brand_applications if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brand_applications' AND column_name = 'status'
  ) THEN
    ALTER TABLE brand_applications 
    ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'reviewing', 'certified', 'rejected'));
  END IF;
END $$;

-- Add status column to contact_submissions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contact_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE contact_submissions 
    ADD COLUMN status TEXT DEFAULT 'new' 
    CHECK (status IN ('new', 'read', 'replied', 'archived'));
  END IF;
END $$;

-- Add status column to product_intake if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_intake' AND column_name = 'status'
  ) THEN
    ALTER TABLE product_intake 
    ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected'));
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON brand_applications(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_product_intake_status ON product_intake(status);

-- =====================================================
-- COMPLETE
-- =====================================================
-- This script adds status columns to existing tables
-- without dropping them or losing data
-- =====================================================

