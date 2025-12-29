# Brand Management Infrastructure - Task Breakdown

## Phase 1: Database Schema & Infrastructure ✅
- [x] Create brand verification tables
  - [x] Add `brand_verifications` table
  - [x] Add `sme_certifications` table  
  - [x] Add `product_view_metrics` table
  - [x] Update `profiles` table with `role` field (BRAND_REP, SME, USER)
  - [x] Update `products` table with brand fields

## Phase 2: Product Wizard Enhancement ✅
- [x] Add Step 5: "Is this your brand?"
  - [x] Create brand verification form fields
  - [x] Add work email validation
  - [x] Add LinkedIn profile field
  - [x] Add company website field
- [x] Integrate Stripe checkout for $100 base subscription
  - [x] Create Stripe checkout session
  - [x] Handle payment success/failure
  - [x] Store subscription data

## Phase 3: Admin Portal - Brand Intake Tab ✅
- [x] Create Brand Intake tab in Unified Admin Portal
  - [x] Display pending brand verifications
  - [x] Show submitted email and LinkedIn
  - [x] Add "Approve Brand Account" button
- [x] Implement brand approval workflow
  - [x] Update user role to BRAND_REP
  - [x] Set product `is_verified = true`

## Phase 4: SME Certification Workflow ✅
- [x] Add SME Certification button to Brand Dashboard
  - [x] Create brand dashboard page
  - [x] Add "Apply for SME Certification ($3,000)" button
- [x] Implement Stripe one-time payment
  - [x] Create $3,000 checkout session
  - [x] Handle payment success
- [x] Create secure document uploader
  - [x] Lab reports upload
  - [x] Purity data upload
  - [x] Store documents securely
- [x] Create SME Audit Queue
  - [x] Display submissions in admin portal
  - [x] Add verification controls for SME experts
  - [x] Update `is_sme_certified` flag on approval

## Phase 5: Product UI Updates ✅
- [x] Dynamic "Buy It Now" button
  - [x] Show only if `is_verified = true`
  - [x] Add discount code field
- [x] SME Certification badge
  - [x] Display if `is_sme_certified = true`
  - [x] Create badge component
  - [x] Position prominently on product page

## Phase 6: Metered Billing (Remaining)
- [ ] Create view tracking function
  - [ ] Increment `visit_count` on product view
  - [ ] Store in database
- [ ] Implement Stripe metered billing sync
  - [ ] Create daily sync job
  - [ ] Report usage to Stripe API
  - [ ] Handle errors and retries
