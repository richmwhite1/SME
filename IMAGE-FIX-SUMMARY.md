# Image Display Fix - Summary

## Problem
Images uploaded during product creation are not displaying on product pages.

## Root Cause Analysis

The issue likely stems from one of these problems:

1. **Array Format Mismatch**: PostgreSQL TEXT[] arrays might not be properly serialized/deserialized by Supabase JS client
2. **Select Query Issue**: Using `select("*")` might not properly handle array columns
3. **Data Type Handling**: The images might be stored but retrieved in an unexpected format

## Fixes Applied

### 1. Enhanced Image Retrieval (`app/products/[id]/page.tsx`)
- ✅ Explicitly select `images` column in query
- ✅ Handle multiple array formats (JavaScript array, JSON string, PostgreSQL array string)
- ✅ Parse PostgreSQL array format: `{url1,url2}`
- ✅ Comprehensive logging to debug format issues
- ✅ Better error messages showing what format was received

### 2. Enhanced Image Saving (`app/actions/product-actions.ts`)
- ✅ Verify images are included in productData
- ✅ Automatic fix: If images aren't saved on insert, attempt update
- ✅ Comprehensive logging at each step
- ✅ Verify saved images match uploaded images

### 3. Enhanced Upload Flow (`components/admin/ProductOnboardForm.tsx`)
- ✅ Log each upload step
- ✅ Verify images are in FormData before submit
- ✅ Better error handling

### 4. Database Verification Queries
- ✅ `VERIFY-IMAGES-SAVED.sql` - Check if images are in database
- ✅ `TEST-IMAGE-INSERT.sql` - Test array insertion
- ✅ `FIX-IMAGES-STORAGE.sql` - Verify column type

## Next Steps to Debug

### Step 1: Check Database
Run this in Supabase SQL Editor:
```sql
SELECT id, title, images, array_length(images, 1) as count
FROM protocols
WHERE images IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: You should see arrays like `{url1,url2}` or `["url1","url2"]`

### Step 2: Check Console Logs
When creating a product, look for:
- `onboardProduct - Images array being saved: [array]`
- `✅ SUCCESS: Images were saved to database`
- Or `⚠️ WARNING: Images were uploaded but NOT saved`

### Step 3: Check Product Page
When viewing a product, look for:
- `Raw images data from DB: [data]`
- `Processed images array: [array]`
- `Safe images count: [number]`

### Step 4: Verify Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Check `product-images` bucket is **Public**
3. Verify files exist in `products/` folder

## If Images Still Don't Display

### Option A: Column Type Issue
If the column is not TEXT[], run:
```sql
ALTER TABLE protocols ALTER COLUMN images TYPE TEXT[] USING images::TEXT[];
```

### Option B: Use JSONB Instead
If TEXT[] continues to cause issues, we can switch to JSONB:
```sql
ALTER TABLE protocols ALTER COLUMN images TYPE JSONB USING images::jsonb;
```
Then update code to handle JSONB format.

### Option C: Manual Fix for Existing Products
If images exist but aren't displaying, you can manually update:
```sql
UPDATE protocols 
SET images = ARRAY['https://your-url.com/image.jpg']::TEXT[]
WHERE id = 'product-id-here';
```

## Testing Checklist

- [ ] Upload a new product with images
- [ ] Check server console for upload/save logs
- [ ] Check database to verify images are stored
- [ ] View product page and check browser console
- [ ] Verify images display or see helpful error message
- [ ] Test in incognito mode (to verify bucket is public)




