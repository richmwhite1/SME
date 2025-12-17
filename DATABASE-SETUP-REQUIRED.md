# Database Setup Required

## ⚠️ Action Required: Run SQL Migration

The `product_comments` table needs to be created in your Supabase database.

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

**Option 1: Simple Version (Recommended - No Foreign Keys)**

Copy and paste the entire contents of `supabase-product-comments-simple.sql` into the SQL Editor, then click **Run**.

**Or copy this SQL directly:**

```sql
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comments_protocol_id ON product_comments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author_id ON product_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_comments_is_flagged ON product_comments(is_flagged) WHERE is_flagged = true;

ALTER TABLE product_comments DISABLE ROW LEVEL SECURITY;
```

**Option 2: With Foreign Keys (If you get errors, use Option 1)**

If the simple version works and you want to add foreign key constraints later, you can use `supabase-product-comments.sql` which includes error handling for foreign keys.

### Step 3: Verify Success

You should see "Success. No rows returned" or similar success message.

### Step 4: Test

After running the SQL:
1. Go to any product page
2. Try posting a comment
3. It should work now!

---

## What This Creates

- **Table**: `product_comments` - Stores comments on products/protocols
- **Columns**:
  - `id` - Unique identifier
  - `protocol_id` - Links to the product/protocol
  - `author_id` - Links to the user profile
  - `content` - Comment text
  - `flag_count` - Number of flags (for moderation)
  - `is_flagged` - Whether comment is hidden
  - `created_at` / `updated_at` - Timestamps
- **Indexes**: For fast queries
- **RLS**: Disabled (using Clerk for auth)

---

## Troubleshooting

### "Table already exists"
- That's fine! The migration uses `IF NOT EXISTS`, so it's safe to run multiple times.

### "Permission denied"
- Make sure you're using the SQL Editor (not Table Editor)
- You need admin access to your Supabase project

### Still getting errors after running SQL
- Clear your browser cache
- Restart your Next.js dev server
- Check that the table appears in Supabase Table Editor

