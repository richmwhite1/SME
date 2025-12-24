# Product Wizard - Complete Feature Set

## ✅ What's Included

### Step 1: The Narrative
- **Product Name** (required)
- **Primary Category** (required) - dropdown with 10 categories
- **Company Blurb** (required) - mission & story, min 10 characters

### Step 2: Media Assets
- **Product Photos** (up to 10)
  - Cloudinary upload widget
  - Auto-resize to 1200px width
  - Drag-and-drop reordering
  - Delete individual photos
  
- **YouTube Link** (optional)
  - Validates youtube.com and youtu.be URLs
  
- **Technical Documentation Links** (up to 10)
  - Add multiple PDF/document links
  - Lab reports, spec sheets, certifications, etc.
  - Remove individual links

### Step 3: Technical Specifications
- **Dynamic Key-Value Pairs** (optional)
  - Add/remove specs
  - Examples: Weight, Dimensions, Material, Dosage, etc.

## 🎯 How to Use

### Access the Wizard

Navigate to: **http://localhost:3000/products/submit**

### Upload Photos

1. In Step 2, click **"Upload Photo"** button
2. Cloudinary widget will open
3. Select photo from:
   - Local files
   - URL
   - Camera
4. Photo automatically resizes to 1200px width
5. Repeat up to 10 times

**Note**: You need Cloudinary credentials in `.env.local`:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
```

### Add Technical Documentation

1. In Step 2, click **"+ Add Link"**
2. Paste URL to PDF, spec sheet, or documentation
3. Repeat up to 10 times
4. Click "Remove" to delete a link

### Add Technical Specs

1. In Step 3, click **"+ Add Spec"**
2. Enter Key (e.g., "Weight") and Value (e.g., "2kg")
3. Repeat as needed
4. Click X to remove a spec

## 🔧 Admin Features

### Edit Products

Navigate to: **http://localhost:3000/admin/products/[product-id]**

**Features**:
- Edit all product fields
- Upload additional photos (up to 10 total)
- Delete specific photos
- Reorder photos via drag-and-drop
- Update YouTube link
- Add/remove technical documentation links
- Edit technical specs
- **SME Preview** toggle to see exactly what experts will see

### SME Preview Mode

Click **"View as SME"** button to:
- See read-only preview
- Verify all content displays correctly
- Ensure photos are in correct order
- Check technical specs formatting

Click **"Switch to Edit"** to return to editing.

## 📊 Database Schema

```sql
products table:
- name (TEXT) - Product name
- category (TEXT) - Primary category
- company_blurb (TEXT) - Mission & story
- product_photos (JSONB) - Array of Cloudinary URLs (max 10)
- youtube_link (TEXT) - YouTube URL
- tech_docs (JSONB) - Array of documentation URLs (max 10)
- technical_specs (JSONB) - Key-value pairs
```

## 🐛 Troubleshooting

### Cloudinary Upload Not Working

**Problem**: "Upload Photo" button doesn't work

**Solution**:
1. Check `.env.local` has Cloudinary credentials
2. Verify upload preset is "Unsigned" in Cloudinary dashboard
3. Check browser console for errors
4. Restart dev server after adding credentials

### Photos Not Appearing

**Problem**: Uploaded photos don't show in grid

**Solution**:
1. Check browser console for errors
2. Verify Cloudinary URLs are valid
3. Check if photos array is being saved (inspect network tab)

### Can't Submit Product

**Problem**: Submit button is disabled

**Solution**:
1. Ensure all required fields are filled:
   - Product Name
   - Category
   - Company Blurb (min 10 characters)
2. Check for validation errors in red text
3. If YouTube link is entered, ensure it's valid

## 🎨 Features Summary

✅ Cloudinary photo upload (up to 10)  
✅ Auto-resize to 1200px width  
✅ Drag-and-drop photo reordering  
✅ YouTube link validation  
✅ Technical documentation links (up to 10)  
✅ Dynamic technical specifications  
✅ Admin editing suite  
✅ SME preview mode  
✅ Server-side validation  
✅ JSONB storage for flexibility  

## 📝 Next Steps

1. **Add Cloudinary credentials** to `.env.local`
2. **Test the wizard** at `/products/submit`
3. **Upload photos** using Cloudinary widget
4. **Add documentation links** in Step 2
5. **Submit a test product**
6. **Edit in admin panel** at `/admin/products/[id]`
7. **Test SME preview** mode

---

**All features are now live and ready to use!**
