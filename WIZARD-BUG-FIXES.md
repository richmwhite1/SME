# Product Wizard - Bug Fixes Applied

## Issues Fixed

### 1. ✅ YouTube Link Validation Bug
**Problem**: The wizard was rejecting submissions even when YouTube link was empty (optional field).

**Root Cause**: Zod schema was using `.url()` which requires a valid URL format, even for empty strings.

**Fix**: Changed validation to use `.refine()` with custom logic:
```typescript
youtube_link: z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true; // Allow empty
      return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(val);
    },
    { message: "Must be a valid YouTube URL" }
  )
  .nullable()
  .optional(),
```

**File**: `app/actions/submit-product-wizard.ts`

---

### 2. ✅ Button Text Updated
**Problem**: Button said "Submit for Review" instead of "Submit Product for Approval"

**Fix**: Updated button text in ProductWizardV2.tsx line 328:
```typescript
{isSubmitting ? "Submitting..." : "Submit Product for Approval"}
```

**File**: `components/wizard/ProductWizardV2.tsx`

---

### 3. ✅ Drag-and-Drop Bug
**Problem**: PhotoGrid component had undefined variable `toIndex` in onDrop handler

**Root Cause**: Line 53 referenced `toIndex` instead of `index`

**Fix**: Changed to use correct variable:
```typescript
onDrop={(e) => handleDrop(e, index)}
```

**File**: `components/wizard/PhotoGrid.tsx`

---

## Testing Steps

### Test 1: Submit Without Photos or YouTube Link
1. Go to http://localhost:3000/products/submit
2. Fill in Step 1:
   - Product Name: "Test Product"
   - Category: Select any
   - Company Blurb: "This is a test product for our platform"
3. Click "Next Step"
4. Step 2: Skip photos and YouTube link
5. Click "Next Step"
6. Step 3: Skip technical specs
7. Click "Submit Product for Approval"
8. **Expected**: Should submit successfully and redirect to /products

### Test 2: Submit With YouTube Link
1. Repeat Test 1 but add YouTube link in Step 2:
   - YouTube Link: `https://youtube.com/watch?v=dQw4w9WgXcQ`
2. **Expected**: Should submit successfully

### Test 3: Invalid YouTube Link
1. In Step 2, enter invalid URL:
   - YouTube Link: `https://google.com`
2. Try to proceed to Step 3
3. **Expected**: Should show error "Please enter a valid YouTube URL"

### Test 4: Drag-and-Drop Photos
1. Upload 3 photos in Step 2
2. Drag first photo to third position
3. **Expected**: Photos should reorder without errors

---

## What Should Work Now

✅ Submit product without any optional fields  
✅ Submit product with YouTube link  
✅ YouTube validation only triggers for non-empty values  
✅ Button says "Submit Product for Approval"  
✅ Photo drag-and-drop works correctly  
✅ All required fields validated  

---

## If Still Having Issues

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any red errors
4. Report the exact error message

### Check Network Tab
1. Open DevTools → Network tab
2. Try to submit
3. Look for failed requests (red)
4. Click on the failed request
5. Check the "Response" tab for error details

### Check Server Logs
The terminal running `npm run dev` will show server-side errors.

---

## Next Steps

1. Test the wizard with the steps above
2. If submission works, verify the product appears in the database
3. Test the admin editor at `/admin/products/[product-id]`
4. Test SME preview mode
