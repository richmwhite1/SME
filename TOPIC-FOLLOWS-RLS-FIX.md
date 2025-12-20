# Topic Follows RLS Fix

## Problem
When trying to follow a topic from the Topic Leaderboard or topic page, you get this error:
```
Error: Failed to follow topic: new row violates row-level security policy for table "topic_follows"
```

## Root Cause
Row Level Security (RLS) is still enabled on the `topic_follows` table, but we're using Clerk for authentication (not Supabase Auth). RLS requires Supabase Auth to work properly.

## Solution
Run the SQL script to disable RLS on the `topic_follows` table.

### Steps:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-fix-topic-follows-rls.sql`
4. Run the script

The script will:
- Disable RLS on `topic_follows` table
- Drop any existing RLS policies
- Verify the change

## After Running the Script
Once you've run the SQL script, the follow/unfollow functionality should work correctly on:
- Topic Leaderboard (sidebar)
- Topic detail pages (`/topic/[name]`)
- Anywhere else topics can be followed

## Verification
After running the script, try following a topic again. The error should be gone and the follow button should work.





