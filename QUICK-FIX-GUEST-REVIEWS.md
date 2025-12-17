# Quick Fix: Guest Reviews Column Missing

## Error Message
```
Failed to submit review: Could not find the 'guest_author_name' column of 'reviews' in the schema cache
```

## Solution: Run SQL Migration

The `guest_author_name` column needs to be added to your `reviews` table in Supabase.

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run This SQL:**

```sql
-- Add guest_author_name column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS guest_author_name TEXT;

-- Make user_id nullable (if it's currently NOT NULL)
-- If this line fails, your user_id might already be nullable - that's okay
ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify Success:**
   - You should see "Success. No rows returned"
   - If you see an error on the `DROP NOT NULL` line, that's usually fine (column might already be nullable)

6. **Test Again:**
   - Go back to your app
   - Try submitting a guest review again
   - It should work now!

## Alternative: Run the Full Migration File

If you prefer, you can copy/paste the entire contents of:
- `supabase-guest-reviews.sql` (full version with error handling)
- `supabase-guest-reviews-simple.sql` (simpler version)

Both will work - the simple version is easier to understand.

## Troubleshooting

### If `DROP NOT NULL` fails:
- Your `user_id` column might already be nullable
- Or it might have a foreign key constraint
- **Solution**: Skip that line and continue - the column addition is the critical part

### If you see "permission denied":
- Make sure you're using the SQL Editor (not the Table Editor)
- You need admin access to your Supabase project

### After running, still getting errors:
- Clear your browser cache
- Restart your Next.js dev server: `npm run dev`
- Supabase schema cache might take a few seconds to update

## What This Does

1. **Adds `guest_author_name` column**: Stores display names for guest reviews
2. **Makes `user_id` nullable**: Allows reviews without a user account
3. **Creates index**: Improves query performance when filtering by user_id

Once this is done, guest reviews will work perfectly! 🎉


