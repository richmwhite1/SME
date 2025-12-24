# Cloudinary Quick Setup

## 1. Get Your Cloud Name

1. Go to: https://cloudinary.com/console
2. Copy the **Cloud Name** (shown at the top)

## 2. Create Upload Preset

1. Go to: **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Configure:
   - **Preset name**: `product_photos`
   - **Signing Mode**: **Unsigned** ⚠️ IMPORTANT
   - **Folder**: `products` (optional)
4. Click **Save**

## 3. Add to .env.local

```bash
# Add these lines to your .env.local file:
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=product_photos
```

## 4. Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## 5. Test the Wizard

Navigate to: http://localhost:3000/products/submit

---

**That's it!** The wizard is ready to use.

For detailed setup and troubleshooting, see: [PRODUCT-WIZARD-SETUP.md](file:///Users/richardwhite/Library/Mobile%20Documents/com~apple~CloudDocs/SME%20v3/PRODUCT-WIZARD-SETUP.md)
