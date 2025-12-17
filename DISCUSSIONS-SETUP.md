# Discussion Board & Activity Feed Upgrade

## New Features

### 1. Discussion Board

**Page**: `/discussions`
- Lists all community discussions
- Shows title, author, date, tags
- "Start Discussion" button (authenticated users only)

**Create Discussion**: `/discussions/new`
- Form with title, content, tags (max 5)
- AI moderation using `checkVibe()` - discussions are vetted before posting
- Redirects to discussions list after creation

### 2. Upgraded Feed Page

**Two Tabs**:
- **My Tribe**: Activity from users you follow (uses `follower_feed` view)
- **Community Pulse**: Global activity feed (uses `global_feed` view, limited to 20 items)

**Distinct Cards**:
- Discussion cards: Green badge with MessageSquare icon, shows tags
- Review cards: Gray badge with Star icon, shows protocol link

### 3. Share Profile Button

**Location**: Profile page (`/u/[username]`)
- Small "Share" button next to the user's name
- Copies profile URL to clipboard
- Shows "Copied!" confirmation for 2 seconds

## Database Setup

### Step 1: Create Global Feed View

Run this SQL in Supabase SQL Editor:

```sql
CREATE OR REPLACE VIEW global_feed AS
-- Reviews
SELECT
  'review' AS activity_type,
  r.id AS activity_id,
  r.created_at,
  r.user_id AS author_id,
  COALESCE(p.full_name, r.guest_author_name, 'Guest') AS author_name,
  p.avatar_url AS author_avatar,
  pr.title AS title,
  r.content,
  NULL::text[] AS tags,
  r.protocol_id AS related_id,
  'protocol' AS related_type,
  pr.slug AS protocol_slug,
  pr.title AS protocol_title
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id
LEFT JOIN protocols pr ON r.protocol_id = pr.id
WHERE r.is_flagged = false

UNION ALL

-- Discussions
SELECT
  'discussion' AS activity_type,
  d.id AS activity_id,
  d.created_at,
  d.author_id,
  COALESCE(p.full_name, 'Anonymous') AS author_name,
  p.avatar_url AS author_avatar,
  d.title,
  d.content,
  d.tags,
  NULL AS related_id,
  NULL AS related_type,
  d.slug AS protocol_slug,
  d.title AS protocol_title
FROM discussions d
LEFT JOIN profiles p ON d.author_id = p.id

ORDER BY created_at DESC;
```

Or use the file: `supabase-global-feed-view.sql`

## Files Created

### Server Actions
- `app/actions/discussion-actions.ts` - `createDiscussion()`

### Pages
- `app/discussions/page.tsx` - Discussion list
- `app/discussions/new/page.tsx` - Create discussion

### Components
- `components/discussions/DiscussionForm.tsx` - Discussion creation form
- `components/feed/FeedTabs.tsx` - Tab switcher for feed
- `components/feed/FeedItemCard.tsx` - Activity card (review or discussion)
- `components/feed/RecommendedContributorCard.tsx` - Contributor recommendation card
- `components/profile/ShareProfileButton.tsx` - Share profile button

### Updated Files
- `app/feed/page.tsx` - Now with tabs
- `app/u/[username]/page.tsx` - Added share button

## Features

### Discussion Creation Flow

1. User clicks "Start Discussion"
2. Fills in title (min 5 chars), content (min 20 chars), tags (optional, max 5)
3. AI moderation runs via `checkVibe()`
4. If safe → inserted into `discussions` table with unique slug
5. If unsafe → error shown to user
6. Redirects to `/discussions` on success

### Feed Tabs

**My Tribe Tab**:
- Shows activity from followed users
- Fetches from `follower_feed` view
- Empty state: "Your tribe hasn't posted anything yet"
- If not following anyone: Shows recommended contributors

**Community Pulse Tab**:
- Shows all community activity (last 20 items)
- Fetches from `global_feed` view
- Combines reviews and discussions
- Sorted by `created_at` descending

### Activity Cards

**Discussion Card**:
- Green badge: "Discussion"
- Shows discussion title (large)
- Shows content
- Shows tags (if any)
- Author avatar & name
- Timestamp

**Review Card**:
- Gray badge: "Review"
- Shows protocol link (with BookOpen icon)
- Shows review content
- Author avatar & name
- Timestamp

## Usage

### Creating a Discussion

1. Navigate to `/discussions`
2. Click "Start Discussion" (must be logged in)
3. Fill in title, content, and optionally add tags
4. Click "Post Discussion"
5. AI moderation runs automatically
6. Redirected to discussions list

### Viewing Feed

1. Navigate to `/feed` (must be logged in)
2. Toggle between "My Tribe" and "Community Pulse" tabs
3. "My Tribe": See activity from people you follow
4. "Community Pulse": See all community activity

### Sharing a Profile

1. Visit any user's profile (`/u/username`)
2. Click the "Share" button next to their name
3. Profile URL is copied to clipboard
4. "Copied!" confirmation shown briefly

## Key Points

1. **AI Moderation**: All discussions are vetted by `checkVibe()` before posting
2. **Tabs Default**: Opens "My Tribe" if following anyone, otherwise "Community Pulse"
3. **Global Feed Limit**: Limited to 20 items for performance
4. **Distinct Design**: Discussion and review cards look different for easy scanning
5. **Share Button**: Uses clipboard API with fallback alert


