# Admin Command Center Setup

## Overview
The Admin Command Center has been built at `/admin/dashboard` with full product inventory management, certification controls, and signal monitoring.

## What Was Built

### 1. Admin Dashboard (`app/admin/dashboard/page.tsx`)
- **Product Inventory Table**: Displays all products with:
  - Product Name (clickable link)
  - Created Date
  - Certification Status (Certified vs. Pending)
  - Review Count
  - Quick Actions: Edit, Certify/Uncertify, View Analytics buttons

- **Stats Cards**: Shows:
  - Total Products
  - Certified Products
  - Pending Products
  - Flagged Content Count

- **Signal Monitoring Sidebar**: Displays recently flagged content from:
  - Discussions
  - Reviews
  - Discussion Comments
  - Product Comments

### 2. Certification Management (`components/admin/CertificationModal.tsx`)
- Toggle certification status (Certify/Uncertify)
- Update all 5 Verification Pillars:
  1. Source Transparency
  2. Purity
  3. Potency
  4. Excipient Audit
  5. Operational Legitimacy
- Update Certification Notes
- Update COA URL
- Legacy field: 3rd Party Lab Verified

### 3. Server Actions (`app/actions/admin-actions.ts`)
- `toggleProductCertification()`: Toggle certification and update all certification fields
- `getFlaggedContent()`: Fetch all flagged content across the site

### 4. Product Display Updates (`app/products/[slug]/page.tsx`)
- SME Certified badge now shows the correct **5 Pillars** in a high-contrast tooltip on hover
- Transparency Checklist displays all 5 pillars clearly
- Certification Notes section (if available)
- Updated to fetch and display all new certification fields

### 5. Navigation (`components/layout/Navbar.tsx`)
- Added "Dashboard" link (admin only) using `AdminNavLink` server component
- Only visible to users where `is_admin` is true

### 6. Badge Component Update (`components/admin/SMECertifiedBadge.tsx`)
- Updated to show the correct 5 Pillars:
  1. Source Transparency
  2. Purity
  3. Potency
  4. Excipient Audit
  5. Operational Legitimacy
- High-contrast tooltip on hover showing verification status for each pillar

## Database Setup Required

### Step 1: Add 5 Pillars Fields
Run `supabase-add-5-pillars-fields.sql` in your Supabase SQL Editor to add:
- `potency_verified` (BOOLEAN)
- `excipient_audit` (BOOLEAN)
- `operational_legitimacy` (BOOLEAN)

These fields complete the 5 Pillars certification system.

### Step 2: Verify Existing Fields
Ensure these fields exist (from `supabase-sme-certification-fields.sql`):
- `is_sme_certified` (BOOLEAN)
- `source_transparency` (BOOLEAN)
- `purity_tested` (BOOLEAN)
- `third_party_lab_verified` (BOOLEAN)
- `certification_notes` (TEXT)
- `coa_url` (TEXT)

## Usage

### Accessing the Dashboard
1. Ensure your user has `is_admin = true` in the `profiles` table
2. Navigate to `/admin/dashboard` or click "Dashboard" in the navbar (admin only)

### Certifying a Product
1. Go to Admin Dashboard
2. Find the product in the Product Inventory table
3. Click "Certify" button
4. In the modal:
   - Toggle certification status
   - Check/uncheck the 5 Verification Pillars
   - Add Certification Notes
   - Add COA URL
5. Click "Save Certification"

### Viewing Flagged Content
- The Signal Monitoring sidebar automatically shows recently flagged content
- Click any flagged item to view it
- Items are sorted by flag count (highest first)

## Features

### Product Inventory Table
- Sortable by creation date
- Quick access to edit, certify, and view analytics
- Real-time certification status badges
- Review count for each product

### Certification Modal
- Full control over all certification fields
- 5 Pillars checklist
- Certification notes for documentation
- COA URL for Certificate of Analysis

### Signal Monitoring
- Real-time flagged content tracking
- Categorized by content type
- Quick links to review flagged items
- Flag count display

## Security
- All admin actions are protected by `isAdmin()` check
- Server actions verify admin status before allowing changes
- Dashboard page redirects non-admins to home page

## Next Steps
1. Run the SQL migration (`supabase-add-5-pillars-fields.sql`)
2. Test certification workflow on a product
3. Review flagged content in the Signal Monitoring section
4. Customize certification notes and COA URLs as needed





