# 🎉 Cloudinary Configured! Next Steps

## ✅ Credentials Added

Your `.env.local` now has:
- Cloud Name: `dbpfswbkm`
- Upload Preset: `sme_products`
- API Key: `491797598681316`
- API Secret: `***` (hidden for security)

## 🔄 RESTART REQUIRED

Environment variables only load when the server starts. You must restart:

### In your terminal running `npm run dev`:

1. Press **Ctrl+C** to stop the server
2. Wait for it to fully stop
3. Run: `npm run dev`
4. Wait for "Ready" message

## ⚠️ Important: Verify Upload Preset

Before testing, make sure you created the `sme_products` preset in Cloudinary:

1. Go to https://console.cloudinary.com/settings/upload
2. Scroll to **Upload presets**
3. Look for `sme_products`
4. If it doesn't exist, click **Add upload preset**:
   - Preset name: `sme_products`
   - **Signing Mode: Unsigned** ⚠️ CRITICAL!
   - Folder: `products` (optional)
   - Click Save

## 🧪 Test Photo Upload

After restarting the server:

1. Go to http://localhost:3000/products/submit
2. Fill Step 1 (name, category, blurb)
3. Click "Next Step"
4. In Step 2, click **"Upload Photo"**
5. Cloudinary widget should open (no errors!)
6. Select a photo from your computer
7. Photo should upload and appear in grid
8. Try uploading another photo
9. Try dragging to reorder
10. Try clicking X to delete

## 📸 What Happens During Upload

1. You click "Upload Photo"
2. Cloudinary widget opens
3. You select a photo (e.g., 5MB JPEG)
4. Photo uploads to Cloudinary cloud
5. Cloudinary automatically:
   - Resizes to 1200px width
   - Optimizes quality
   - Converts to WebP (~200KB)
6. Returns optimized URL
7. Photo appears in grid
8. URL stored in wizard state
9. On submit, URLs saved to database as JSONB array

## 🐛 If Upload Still Fails

Check browser console for specific error:

- **401 Unauthorized**: Preset not set to "Unsigned"
- **400 Bad Request**: Cloud name incorrect
- **404 Not Found**: Preset doesn't exist
- **YOUR_CLOUD_NAME**: Server not restarted

## ✨ You're Ready!

Once the server restarts, the wizard will have full photo upload capability with automatic resizing and optimization!
