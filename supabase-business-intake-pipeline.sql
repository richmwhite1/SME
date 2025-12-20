-- =====================================================
-- Business Intake Pipeline - Database Schema
-- =====================================================
-- Creates tables for brand applications, contact submissions,
-- and product intake submissions
-- =====================================================

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS product_intake CASCADE;
DROP TABLE IF EXISTS brand_applications CASCADE;
DROP TABLE IF EXISTS contact_submissions CASCADE;

-- =====================================================
-- 1. Brand Applications Table
-- =====================================================
CREATE TABLE brand_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  product_interest TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'certified', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brand_applications_status ON brand_applications(status);
CREATE INDEX idx_brand_applications_created_at ON brand_applications(created_at DESC);

ALTER TABLE brand_applications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE brand_applications IS 'Brand certification applications from Get Certified form';
COMMENT ON COLUMN brand_applications.status IS 'Application status: pending, reviewing, certified, rejected';

-- =====================================================
-- 2. Contact Submissions Table
-- =====================================================
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE contact_submissions IS 'General contact form submissions';
COMMENT ON COLUMN contact_submissions.status IS 'Submission status: new, read, replied, archived';

-- =====================================================
-- 3. Product Intake Submissions Table
-- =====================================================
CREATE TABLE product_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('standard', 'featured')),
  wants_certification BOOLEAN DEFAULT false,
  purity_doc_url TEXT, -- URL to uploaded purity test document
  purity_doc_filename TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_by TEXT, -- User ID if authenticated, null if guest
  submitted_email TEXT NOT NULL, -- Email of submitter
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_intake_status ON product_intake(status);
CREATE INDEX idx_product_intake_tier ON product_intake(tier);
CREATE INDEX idx_product_intake_created_at ON product_intake(created_at DESC);

ALTER TABLE product_intake DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_intake IS 'Product listing submissions from List Your Product wizard';
COMMENT ON COLUMN product_intake.tier IS 'Listing tier: standard (free) or featured ($100/mo)';
COMMENT ON COLUMN product_intake.purity_doc_url IS 'URL to uploaded purity test/Gold Standard documentation';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the Business Intake Pipeline tables
-- =====================================================

