# 🚨 CLOUDINARY SETUP REQUIRED

## The Problem

The Cloudinary upload widget is showing `YOUR_CLOUD_NAME` errors because the environment variables are not configured.

## The Solution (5 minutes)

### Step 1: Get Your Cloudinary Cloud Name

1. Go to https://cloudinary.com/console
2. Sign in (or create free account)
3. Copy your **Cloud Name** from the dashboard (top of page)

### Step 2: Create Upload Preset

1. In Cloudinary Console, click **Settings** (gear icon)
2. Go to **Upload** tab
3. Scroll to **Upload presets** section
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `sme_products` (or any name you like)
   - **Signing Mode**: **Unsigned** ⚠️ CRITICAL - Must be Unsigned!
   - **Folder**: `products` (optional)
6. Click **Save**
7. Copy the preset name

### Step 3: Add to .env.local

Open `.env.local` and add these lines:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=sme_products
```

**Replace `your_actual_cloud_name_here` with your actual cloud name from Step 1!**

### Step 4: Restart Dev Server

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Step 5: Test Upload

1. Go to http://localhost:3000/products/submit
2. Navigate to Step 2
3. Click **"Upload Photo"**
4. Widget should now open without errors
5. Upload a photo
6. Photo should appear in the grid below

## What the Auto-Resize Does

When configured correctly, Cloudinary will:
- ✅ Resize images to 1200px width automatically
- ✅ Maintain aspect ratio
- ✅ Optimize quality (auto:good)
- ✅ Convert to WebP format automatically
- ✅ Serve via CDN for fast loading

This saves storage space and bandwidth!

## Still Having Issues?

### Error: "YOUR_CLOUD_NAME"
- You haven't added the credentials to `.env.local`
- Or you haven't restarted the dev server

### Error: 401 Unauthorized
- Your upload preset is not set to "Unsigned"
- Go back to Cloudinary → Settings → Upload → Edit your preset
- Change "Signing Mode" to "Unsigned"

### Error: 400 Bad Request
- Your cloud name is incorrect
- Double-check it matches exactly from Cloudinary dashboard

---

**Once configured, the wizard will work perfectly!**
