# Product Onboarding Wizard - Setup Guide

## Overview

This guide will help you set up the Product Onboarding Wizard with Cloudinary integration and the Admin Editing Suite.

## Prerequisites

- Cloudinary account (free tier is sufficient)
- Database migration has been run
- Next.js development server running

## Step 1: Cloudinary Configuration

### 1.1 Get Your Cloudinary Credentials

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Copy your **Cloud Name** from the dashboard
3. Note your **API Key** (you already have: `491797598681316`)

### 1.2 Create an Unsigned Upload Preset

1. In Cloudinary Console, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `product_photos` (or your choice)
   - **Signing Mode**: **Unsigned** ⚠️ Important!
   - **Folder**: `products` (optional, for organization)
   - **Transformation**: Leave default (we handle resize in widget)
5. Click **Save**
6. Copy the preset name

### 1.3 Add Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=product_photos
```

**Important**: These must be `NEXT_PUBLIC_` variables because the Cloudinary widget runs in the browser.

## Step 2: Verify Database Migration

The migration has already been run. Verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('company_blurb', 'product_photos', 'youtube_link', 'technical_specs');
```

Expected columns:
- `company_blurb` (TEXT)
- `product_photos` (JSONB)
- `youtube_link` (TEXT)
- `technical_specs` (JSONB)

## Step 3: Test the Wizard

### 3.1 Access the Wizard

Navigate to: `http://localhost:3000/products/submit`

### 3.2 Test Step 1: The Narrative

- Enter a product name
- Select a category
- Write a company blurb (mission & story)
- Click "Next Step"

### 3.3 Test Step 2: Media Assets

- Click "Upload Photo" to open Cloudinary widget
- Upload 1-10 photos (they'll auto-resize to 1200px width)
- Drag photos to reorder them
- Click X to delete a photo
- Enter a YouTube URL (optional): `https://youtube.com/watch?v=...`
- Click "Next Step"

### 3.4 Test Step 3: Technical Specs

- Click "Add Spec" to add key-value pairs
- Example: Key: "Weight", Value: "2kg"
- Add multiple specs
- Click "Submit for Review"

### 3.5 Verify Submission

- Check that you're redirected to `/products`
- Verify the product appears in the database

## Step 4: Test Admin Editing Suite

### 4.1 Access Admin Editor

Navigate to: `http://localhost:3000/admin/products/[product-id]`

Replace `[product-id]` with an actual product UUID from your database.

### 4.2 Test Edit Mode

- Edit the product name
- Change the category
- Update the company blurb
- Click "Save Changes"
- Verify changes are saved

### 4.3 Test Photo Management

- Click "Upload Photo" to add more photos (up to 10 total)
- Drag photos to reorder
- Click X to delete a photo
- Click "Save Changes"

### 4.4 Test SME Preview

- Click "View as SME" button
- Verify the view switches to read-only preview mode
- Confirm this is exactly what SMEs will see
- Click "Switch to Edit" to return to edit mode

## Step 5: Troubleshooting

### Cloudinary Widget Not Loading

**Problem**: Upload button doesn't work or widget doesn't open.

**Solution**:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly
3. Verify `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` matches your preset name
4. Ensure the upload preset is set to "Unsigned" mode

### Photos Not Auto-Resizing

**Problem**: Photos are larger than 1200px width.

**Solution**:
The resize happens in the Cloudinary widget configuration. Check `CloudinaryUploadWidget.tsx` line 47:
```javascript
transformation: [
  {
    width: 1200,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  },
],
```

### YouTube Validation Failing

**Problem**: Valid YouTube URLs are rejected.

**Solution**:
The regex accepts both formats:
- `https://youtube.com/watch?v=...`
- `https://youtu.be/...`

Ensure the URL includes the protocol (`https://`).

### Database Errors

**Problem**: "Column does not exist" errors.

**Solution**:
Run the migration again:
```bash
node scripts/run-wizard-migration.js
```

## File Structure

```
app/
├── actions/
│   ├── submit-product-wizard.ts    # Wizard submission
│   └── update-product-admin.ts     # Admin updates
├── admin/
│   └── products/
│       └── [id]/
│           ├── page.tsx            # Admin editor page
│           └── ProductEditorClient.tsx
└── products/
    └── submit/
        └── page.tsx                # Wizard page

components/
├── admin/
│   ├── ProductPhotoManager.tsx     # Photo management
│   └── SMEPreviewToggle.tsx        # Preview toggle
└── wizard/
    ├── CloudinaryUploadWidget.tsx  # Upload widget
    ├── PhotoGrid.tsx               # Photo display
    ├── ProductWizardV2.tsx         # Main wizard
    └── TechnicalSpecsEditor.tsx    # Specs editor

migrations/
└── product-wizard-cloudinary.sql   # Database migration
```

## Features Summary

### Product Onboarding Wizard (3 Steps)

**Step 1: The Narrative**
- Product name input
- Category dropdown
- Company blurb textarea (markdown support)

**Step 2: Media Assets**
- Cloudinary photo uploader (max 10 photos)
- Auto-resize to 1200px width
- Photo grid with delete and reorder
- YouTube link validation

**Step 3: Technical Specs**
- Dynamic key-value pairs
- Add/remove specs
- Stored as JSONB

### Admin Editing Suite

**Photo Management**
- Upload additional photos
- Delete specific photos
- Drag-and-drop reordering
- Max 10 photos enforced

**Content Editing**
- Edit all product fields
- Update company blurb
- Modify YouTube link
- Edit technical specs

**SME Preview**
- Toggle between edit and preview modes
- Shows exactly what SMEs will see
- Read-only preview mode

## Next Steps

1. Add Cloudinary credentials to `.env.local`
2. Test the complete wizard flow
3. Test admin editing features
4. Test SME preview mode
5. Consider adding:
   - Image cropping in Cloudinary widget
   - Rich text editor for company blurb
   - Bulk photo upload
   - Photo captions/alt text
