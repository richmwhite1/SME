# Image Display Debugging Guide

## Current Status
Images are not displaying on product pages. This guide will help identify and fix the issue.

## Debugging Steps

### 1. Check Browser Console
Open the browser console (F12) and look for:
- `Product Detail Page - Fetching product with ID: [id]`
- `Raw images data: [data]`
- `Processed images array: [array]`
- `Safe images count: [number]`
- `ProductImageGallery received images: [array]`

### 2. Check Server Console
Look for logs from `onboardProduct`:
- `onboardProduct - Images JSON received: [json]`
- `onboardProduct - Parsed images array: [array]`
- `onboardProduct - Images array being saved: [array]`
- `onboardProduct - Images saved: [array]`

### 3. Verify Database Storage
Run this SQL in Supabase SQL Editor:
```sql
SELECT id, title, images 
FROM protocols 
WHERE images IS NOT NULL 
LIMIT 5;
```

Check:
- Is `images` column populated?
- Is it an array `["url1", "url2"]` or a JSON string?
- Are the URLs full URLs starting with `https://`?

### 4. Verify Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Check `product-images` bucket:
   - Is it set to **Public**? (Must be ON)
   - Do files exist in the `products/` folder?
   - Can you access a file URL directly in browser?

### 5. Test Image URL Directly
1. Copy an image URL from the database
2. Paste it directly in browser address bar
3. Does it load?
   - ✅ If yes: URL is correct, check component rendering
   - ❌ If no: Bucket is private or URL is wrong

## Common Issues & Fixes

### Issue 1: Images stored as JSON string instead of array
**Symptom:** Console shows `typeof images = "string"` instead of `"object"`

**Fix:** The code now handles both cases - arrays and JSON strings are both parsed correctly.

### Issue 2: Images are null or empty
**Symptom:** `Raw images data: null` or `Images array length: 0`

**Possible causes:**
- Images weren't uploaded during product creation
- Upload failed silently
- Images weren't saved to database

**Fix:** Check upload logs and verify `uploadProductImage` is being called.

### Issue 3: Images are paths, not full URLs
**Symptom:** URLs look like `products/filename.jpg` instead of `https://...supabase.co/...`

**Fix:** The upload action should return full URLs. Check `app/actions/image-actions.ts` - it uses `getPublicUrl()` which should return full URLs.

### Issue 4: Bucket is private
**Symptom:** Images load for you but not for others, or 403 errors in console

**Fix:** Set bucket to Public in Supabase Dashboard.

### Issue 5: Images filtered out as invalid
**Symptom:** Console shows `Invalid image URL filtered out: [url]`

**Possible causes:**
- URL doesn't start with `http://` or `https://`
- URL is null or empty string
- URL format is incorrect

**Fix:** Check the actual URL format in database and verify it matches expected format.

## What to Check Next

1. **Upload a new product with images** and watch the console logs
2. **Check the database** to see what was actually saved
3. **Test a direct image URL** in browser
4. **Verify bucket is public**
5. **Check Next.js Image component** - might need to add Supabase domain to `next.config.js`

## Next.js Image Configuration

If images still don't load, add Supabase domain to `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
    },
  ],
}
```

## Reporting Issues

When reporting, include:
1. Browser console logs (all image-related logs)
2. Server console logs (from product creation)
3. Database query result showing images column
4. Direct URL test result
5. Bucket public/private status




