# Storage Bucket Setup Guide

## Problem
When uploading product images, you get "Bucket not found" error. This is because:
1. The bucket might not exist or have a different name
2. Storage policies might not be configured correctly for Clerk authentication

## Solution

### Step 1: Create the Bucket in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create bucket"**
4. Configure the bucket:
   - **Name**: `product-images` (must match exactly)
   - **Public bucket**: Toggle **ON** (this is important!)
   - **File size limit**: 5MB (5242880 bytes)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
5. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

Since we're using Clerk (not Supabase Auth), we need to configure storage policies differently.

**Option A: Public Bucket (Recommended)**
- If the bucket is set to **Public**, you don't need complex policies
- The application will handle authentication server-side using the service role key

**Option B: Add Policies (If bucket is not public)**
Run the SQL in `supabase-storage-bucket-setup.sql` to add policies.

### Step 3: Environment Variables

Make sure you have the service role key set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # IMPORTANT for uploads!
```

**To get your service role key:**
1. Go to Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Copy the **service_role** key (keep this secret!)

### Step 4: Verify Bucket Name

The code uses `product-images` as the bucket name. Make sure:
- The bucket name in Supabase matches exactly: `product-images`
- It's case-sensitive
- No spaces or special characters

## How It Works Now

1. **Client-side**: User selects images in the form
2. **Server-side**: Images are uploaded using a server action (`uploadProductImage`)
3. **Service Role**: The server action uses the service role key to bypass RLS
4. **Authentication**: Admin status is checked in the application layer before upload
5. **Public URLs**: Once uploaded, images are accessible via public URLs

## Troubleshooting

### "Bucket not found" Error
- ✅ Check bucket name is exactly `product-images`
- ✅ Verify bucket exists in Supabase Dashboard
- ✅ Make sure bucket is set to Public

### "Permission denied" Error
- ✅ Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- ✅ Verify the service role key is correct
- ✅ Restart your Next.js dev server after adding the key

### Images not displaying
- ✅ Check bucket is set to Public
- ✅ Verify the public URL is correct
- ✅ Check Next.js image configuration allows Supabase domains

## Next.js Image Configuration

Add Supabase storage domain to `next.config.js`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-project.supabase.co',
    },
  ],
}
```

Replace `your-project` with your actual Supabase project reference.

## Security Notes

- The service role key has full access - keep it secret!
- Never expose it in client-side code
- Admin authentication is checked before allowing uploads
- File validation (type, size) happens before upload





