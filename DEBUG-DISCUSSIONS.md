# Debugging Discussion Feed Issues

## Issues Fixed

### 1. ✅ Explicit Field Setting in createDiscussion
**Problem:** `is_flagged` and `flag_count` weren't explicitly set during insert.
**Fix:** Added explicit fields to insertData:
```typescript
is_flagged: false,
flag_count: 0,
```

### 2. ✅ Debug Logging in Discussions Page
**Problem:** No visibility into what data was being fetched.
**Fix:** Added comprehensive logging:
- Raw discussion count
- Error details
- First discussion sample with all fields
- Client-side filter as backup

### 3. ✅ Global Feed View Fix
**Problem:** 
- Type mismatch between `author_id` (TEXT in discussions) and `profiles.id`
- Missing `is_flagged` column handling
**Fix:**
- Cast `author_id::text` explicitly
- Use `COALESCE(d.is_flagged, false) = false` to handle missing column

### 4. ✅ Removed Premature Filter
**Problem:** Query filtered by `is_flagged` before column existed.
**Fix:** Removed `.eq("is_flagged", false)` from query, added client-side filter as backup.

## How to Debug

### Check Server Terminal
After creating a discussion, look for these logs:

```
Inserting discussion with data: {
  title: "...",
  author_id: "...",
  slug: "...",
  is_flagged: false,
  flag_count: 0
}

Discussion created successfully: <uuid>

=== DISCUSSIONS FETCH DEBUG ===
Raw discussions count: 1
Error: null
First discussion: {
  id: "...",
  title: "...",
  slug: "...",
  created_at: "...",
  is_flagged: false,
  flag_count: 0
}
```

### Check Supabase Table
1. Go to Supabase Dashboard
2. Navigate to Table Editor → discussions
3. Verify the new row exists with:
   - ✅ `slug` is generated (not null)
   - ✅ `is_flagged` = false
   - ✅ `flag_count` = 0
   - ✅ `author_id` matches your Clerk user ID
   - ✅ `created_at` is recent

### Check Feed Display
1. Navigate to `/discussions`
2. New discussion should appear at the top
3. If not visible:
   - Check server logs for fetch errors
   - Verify RLS is disabled: `ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;`
   - Check if `is_flagged` and `flag_count` columns exist

## Required Database Migrations

Run these in order:

### 1. Add Flagging Columns
```sql
-- Run: supabase-discussions-flagging.sql
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
```

### 2. Disable RLS
```sql
-- Run: supabase-fix-discussions-rls-clerk.sql
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;
```

### 3. Update Global Feed View
```sql
-- Run: supabase-global-feed-view.sql (updated version)
-- This handles the is_flagged column properly
```

## Common Issues

### Discussion not appearing
**Cause:** RLS still enabled
**Fix:** `ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;`

### 404 on detail page
**Cause:** Slug not generated properly
**Fix:** Check logs for slug value, should be `title-timestamp` format

### 500 error on creation
**Cause:** Missing columns or type mismatch
**Fix:** Run all migrations in order

### Empty feed
**Cause:** Query filtering on non-existent `is_flagged` column
**Fix:** Use updated query with `COALESCE` or client-side filter

## Verification Checklist

- [ ] RLS disabled on discussions table
- [ ] `flag_count` and `is_flagged` columns exist
- [ ] Discussion creates successfully (check logs)
- [ ] Discussion appears in `/discussions` page
- [ ] Discussion has valid slug
- [ ] Discussion detail page works (`/discussions/[slug]`)
- [ ] Discussion appears in global feed (`/feed`)
- [ ] revalidatePath is called (logs show this)

## Next Steps

If discussions still don't appear after all fixes:

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check database directly:**
   ```sql
   SELECT id, title, slug, is_flagged, flag_count, created_at, author_id
   FROM discussions
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Test RLS status:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'discussions';
   ```
   Should return `rowsecurity = false`

4. **Verify profile exists:**
   ```sql
   SELECT id, full_name, email
   FROM profiles
   WHERE id = '<your-clerk-user-id>';
   ```

## Success Indicators

When everything works:
- ✅ Server logs show successful insert
- ✅ Server logs show discussions fetched with count > 0
- ✅ Discussion appears in list immediately (no refresh needed)
- ✅ Clicking discussion goes to detail page
- ✅ Discussion appears in global feed
- ✅ No 404 or 500 errors

