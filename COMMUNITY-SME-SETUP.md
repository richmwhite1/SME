# Community SME Model: Database Setup Guide

## Overview

This upgrade adds support for:
- **Rich Profiles**: Bio, credentials, website, Instagram, expert verification
- **Follower Graph**: Users can follow each other
- **Discussions**: Community forum-style posts
- **Activity Feed**: Unified view of reviews and discussions

## Quick Start

### Step 1: Run the Main SQL Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-community-sme-upgrade.sql`
4. Click **Run**

This will:
- ✅ Add new columns to `profiles` table
- ✅ Create `follows` table with constraints
- ✅ Create `discussions` table
- ✅ Create `activity_feed` view
- ✅ Set up RLS policies (if using Supabase Auth)

### Step 2: (If Using Clerk) Disable RLS

Since you're using Clerk for authentication, run the additional script:

1. In Supabase SQL Editor
2. Copy and paste the contents of `supabase-disable-rls-clerk.sql`
3. Click **Run**

This disables RLS on the new tables so Clerk authentication works properly.

## Database Schema

### Profiles Table (Updated)

New columns added:
- `bio` (TEXT) - User biography
- `credentials` (TEXT) - Professional credentials
- `website_url` (TEXT) - Personal/professional website
- `instagram_handle` (TEXT) - Instagram username (without @)
- `is_verified_expert` (BOOLEAN) - Expert verification status

### Follows Table

```sql
follows (
  id UUID PRIMARY KEY,
  follower_id TEXT → profiles(id),
  following_id TEXT → profiles(id),
  created_at TIMESTAMPTZ
)
```

**Constraints:**
- Cannot follow yourself (`no_self_follow`)
- Can only follow a user once (`unique_follow`)

**Indexes:**
- `idx_follows_follower` - Fast lookup of who a user follows
- `idx_follows_following` - Fast lookup of who follows a user
- `idx_follows_created_at` - Sorted by time

### Discussions Table

```sql
discussions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT → profiles(id),
  slug TEXT UNIQUE,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Features:**
- Unique slug for URL-friendly identifiers
- Array of tags for categorization
- Auto-updating `updated_at` timestamp

**Indexes:**
- `idx_discussions_author` - Find discussions by author
- `idx_discussions_slug` - Fast slug lookup
- `idx_discussions_created_at` - Sorted by time
- `idx_discussions_tags` - GIN index for tag searches

### Activity Feed View

The `activity_feed` view combines reviews and discussions into a unified stream:

```sql
SELECT * FROM activity_feed ORDER BY created_at DESC;
```

**Columns:**
- `activity_type` - 'review' or 'discussion'
- `activity_id` - ID of the review or discussion
- `created_at` - Timestamp
- `author_id`, `author_name`, `author_avatar` - Author info
- `title`, `content` - Activity content
- `tags` - Tags (for discussions)
- `related_id`, `related_type` - Related protocol (for reviews)

## Usage Examples

### Query Activity Feed

```sql
-- Get latest 20 activities
SELECT * FROM activity_feed 
ORDER BY created_at DESC 
LIMIT 20;
```

### Get User's Followers

```sql
-- Who follows user X?
SELECT p.* 
FROM follows f
JOIN profiles p ON f.follower_id = p.id
WHERE f.following_id = 'user-id-here';
```

### Get Users User Follows

```sql
-- Who does user X follow?
SELECT p.* 
FROM follows f
JOIN profiles p ON f.following_id = p.id
WHERE f.follower_id = 'user-id-here';
```

### Get Discussions by Tag

```sql
-- Find discussions tagged with 'gut-health'
SELECT * FROM discussions
WHERE 'gut-health' = ANY(tags)
ORDER BY created_at DESC;
```

## Authentication Notes

### Using Clerk (Current Setup)

Since you're using Clerk:
1. **RLS is disabled** on these tables
2. **Authentication is handled in your app layer** (Server Actions)
3. Use `currentUser()` from Clerk to get the user ID
4. Verify ownership in your Server Actions before allowing updates/deletes

### If You Switch to Supabase Auth

If you migrate to Supabase Auth later:
1. Re-enable RLS: `ALTER TABLE follows ENABLE ROW LEVEL SECURITY;`
2. The policies in the SQL script will work automatically
3. Use `auth.uid()` in your queries

## Next Steps

1. ✅ Run the SQL scripts
2. Create TypeScript types for the new tables
3. Build UI components for:
   - Profile editing (bio, credentials, etc.)
   - Follow/unfollow buttons
   - Discussion creation/display
   - Activity feed component
4. Create Server Actions for:
   - `followUser(userId)`
   - `unfollowUser(userId)`
   - `createDiscussion(title, content, tags)`
   - `getActivityFeed(limit, offset)`

## Files Created

- `supabase-community-sme-upgrade.sql` - Main upgrade script
- `supabase-disable-rls-clerk.sql` - Disable RLS for Clerk
- `COMMUNITY-SME-SETUP.md` - This documentation


