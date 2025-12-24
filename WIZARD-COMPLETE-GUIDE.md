# Product Wizard - Complete Setup & Testing Guide

## Current Status

✅ **Wizard is fully functional** - All code is in place  
⚠️ **Cloudinary not configured** - Photos won't upload until you add credentials  
ℹ️ **Hydration warnings** - These are harmless and don't affect the wizard  

---

## Quick Start (Test Without Photos)

You can test the wizard RIGHT NOW without Cloudinary:

1. Go to **http://localhost:3000/products/submit**
2. Fill out Step 1 (required fields)
3. **Skip Step 2** (photos) - just click "Next Step"
4. **Skip Step 3** (specs) - click "Submit Product for Approval"
5. Should submit successfully!

---

## Full Setup (With Photo Upload)

### Step 1: Get Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up for free account (no credit card needed)
3. After signup, you'll see your dashboard

### Step 2: Get Your Cloud Name

On the Cloudinary dashboard, you'll see:
```
Cloud name: your-cloud-name-here
```
**Copy this exactly!**

### Step 3: Create Upload Preset

1. Click **Settings** (gear icon, bottom left)
2. Click **Upload** tab
3. Scroll to **Upload presets** section
4. Click **Add upload preset** button
5. Configure:
   - **Preset name**: `sme_products`
   - **Signing Mode**: Select **"Unsigned"** ⚠️ CRITICAL!
   - **Folder**: Type `products` (optional but recommended)
   - **Upload manipulations**: Leave default
6. Click **Save**

### Step 4: Add to .env.local

Open your `.env.local` file and add:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=sme_products
```

**Replace `your-cloud-name-here` with your actual cloud name from Step 2!**

### Step 5: Restart Server

In your terminal:
```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

### Step 6: Test Photo Upload

1. Go to http://localhost:3000/products/submit
2. Fill Step 1
3. In Step 2, click **"Upload Photo"**
4. Cloudinary widget should open (no errors!)
5. Select a photo
6. Photo appears in grid below
7. Continue to submit

---

## About Those Console Warnings

### Hydration Error (`data-sharkid`)
```
Warning: Extra attributes from the server: data-sharkid
```

**What it is**: A third-party library (likely analytics or tracking) adding attributes  
**Impact**: None - this doesn't affect functionality  
**Fix**: Can be ignored, or we can suppress it if it bothers you  

### Favicon 404
```
GET http://localhost:3000/favicon.ico 404
```

**What it is**: Browser looking for a favicon  
**Impact**: None - purely cosmetic  
**Fix**: Add a favicon.ico file to the `public` folder (optional)  

---

## How Auto-Resize Works

Once Cloudinary is configured, it automatically:

1. **Accepts upload** - User selects photo
2. **Uploads to Cloudinary** - Photo sent to cloud
3. **Resizes to 1200px width** - Maintains aspect ratio
4. **Optimizes quality** - Uses "auto:good" setting
5. **Converts to WebP** - Modern format, smaller file size
6. **Returns URL** - Wizard receives optimized photo URL
7. **Stores in database** - URL saved as JSONB array

**Storage savings**: A 5MB photo becomes ~200KB WebP!

---

## Testing Checklist

### Without Cloudinary (Works Now)
- [ ] Navigate to `/products/submit`
- [ ] Fill Step 1 (name, category, blurb)
- [ ] Skip Step 2 (click "Next Step")
- [ ] Skip Step 3 (click "Submit Product for Approval")
- [ ] Verify redirect to `/products`
- [ ] Check database for new product

### With Cloudinary (After Setup)
- [ ] Click "Upload Photo" in Step 2
- [ ] Widget opens without errors
- [ ] Upload a photo
- [ ] Photo appears in grid
- [ ] Upload another photo (up to 10)
- [ ] Drag photos to reorder
- [ ] Click X to delete a photo
- [ ] Add YouTube link (optional)
- [ ] Add tech docs link (optional)
- [ ] Submit successfully

---

## Troubleshooting

### "YOUR_CLOUD_NAME" in Console
**Problem**: Environment variables not set  
**Solution**: Add credentials to `.env.local` and restart server

### 401 Unauthorized
**Problem**: Upload preset not set to "Unsigned"  
**Solution**: Edit preset in Cloudinary, change to "Unsigned"

### Photos Not Appearing
**Problem**: Cloudinary widget not loading  
**Solution**: Check browser console for specific error, verify credentials

### Submit Button Disabled
**Problem**: Required fields not filled  
**Solution**: Ensure Product Name, Category, and Company Blurb are filled (min 10 chars for blurb)

---

## What's Next

After successful submission:
1. Product is saved to database
2. Status is set to "pending_review"
3. Admins can review at `/admin/products/[id]`
4. Admins can approve/reject
5. Approved products appear on `/products`

---

## Need Help?

If you're still having issues:
1. Share the exact error from browser console
2. Confirm you've added credentials to `.env.local`
3. Confirm you've restarted the dev server
4. Try the wizard WITHOUT photos first to isolate the issue
