-- =====================================================
-- RLS Policies for Admin Product Creation
-- =====================================================
-- Ensures admins can create/update products in protocols table
-- =====================================================

-- Enable RLS on protocols table (if not already enabled)
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to insert products
CREATE POLICY IF NOT EXISTS "Admins can insert products"
ON protocols
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Allow admins to update products
CREATE POLICY IF NOT EXISTS "Admins can update products"
ON protocols
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Allow admins to delete products
CREATE POLICY IF NOT EXISTS "Admins can delete products"
ON protocols
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Allow public read access to products
CREATE POLICY IF NOT EXISTS "Public can read products"
ON protocols
FOR SELECT
TO public
USING (true);

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to set up
-- RLS policies that allow admins to manage products
-- while keeping public read access.
-- =====================================================




