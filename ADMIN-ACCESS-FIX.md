# Admin Access Fix

## Problem
Getting "Permission denied" error when trying to create products, even though you have admin access in Clerk.

## Root Cause
1. RLS (Row Level Security) is enabled on the `protocols` table
2. RLS policies use `auth.uid()` which doesn't work with Clerk authentication
3. Your profile in the database might not have `is_admin = true` set

## Solution

### Step 1: Disable RLS on Protocols Table

Run this SQL in Supabase SQL Editor:

```sql
-- Disable RLS on protocols table
ALTER TABLE protocols DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Admins can insert products" ON protocols;
DROP POLICY IF EXISTS "Admins can update products" ON protocols;
DROP POLICY IF EXISTS "Admins can delete products" ON protocols;
DROP POLICY IF EXISTS "Public can read products" ON protocols;
```

Or run the complete script: `supabase-fix-protocols-rls-clerk.sql`

### Step 2: Set Your User as Admin in Database

**Find Your Clerk User ID:**
1. Open your browser console (F12 or Cmd+Option+I)
2. When logged in, type: `window.Clerk?.user?.id`
3. Copy the user ID that appears

**Or find it in Clerk Dashboard:**
1. Go to https://dashboard.clerk.com
2. Navigate to Users
3. Find your user and copy the User ID

**Update Your Profile:**
Run this SQL in Supabase SQL Editor (replace `YOUR_CLERK_USER_ID` with your actual ID):

```sql
-- Make sure is_admin column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set yourself as admin (replace YOUR_CLERK_USER_ID)
UPDATE profiles 
SET is_admin = true 
WHERE id = 'YOUR_CLERK_USER_ID';

-- Verify it worked
SELECT id, full_name, username, is_admin 
FROM profiles 
WHERE id = 'YOUR_CLERK_USER_ID';
```

### Step 3: Verify Clerk Metadata (Optional)

If you want to use Clerk's publicMetadata for admin check:

1. Go to Clerk Dashboard > Users > Your User
2. Click "Metadata" tab
3. Add to `publicMetadata`:
   ```json
   {
     "role": "admin"
   }
   ```

## After Running These Scripts

1. Try creating a product again
2. The permission error should be resolved
3. Both Clerk metadata and database `is_admin` will be checked

## Why This Works

- **RLS Disabled**: Since we're using Clerk, RLS policies that check `auth.uid()` don't work. Disabling RLS allows the application layer to handle authentication.
- **Admin Check**: The code checks both:
  - Clerk `publicMetadata.role === "admin"`
  - Database `profiles.is_admin === true`
- **Application Layer Auth**: All authentication and authorization is handled in server actions, not at the database level.





