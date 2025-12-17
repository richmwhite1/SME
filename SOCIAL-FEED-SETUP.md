# Social Feed & Social Media Links - Setup Guide

## Overview

This update adds:
- **Follower Feed**: Personalized activity feed from users you follow
- **Social Media Links**: Discord, Telegram, X, Instagram links on profiles
- **Navigation**: "My Feed" link in navbar

## Database Setup

### Step 1: Add Social Links Column

Run `supabase-social-links.sql` in Supabase SQL Editor:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING GIN (social_links);
```

### Step 2: Create Follower Feed View (Optional)

The feed page queries directly from `reviews` and `discussions` tables, so the view is optional. If you want to use it, run `supabase-follower-feed-view.sql`.

## Features

### 1. Follower Feed (`/feed`)

**Protected Route:**
- Only accessible to authenticated users
- Redirects to homepage if not logged in

**Two Modes:**

**Mode 1: Following Users**
- Shows activity feed from users you follow
- Displays reviews and discussions
- Sorted by most recent first
- Shows author avatar, name, and timestamp
- Links to protocols for reviews

**Mode 2: Not Following Anyone**
- Shows "Recommended Contributors" grid
- Top 10 users by Contributor Score
- Displays avatar, name, username, bio, score
- "View Profile" link for each contributor
- Encourages users to follow to populate feed

### 2. Social Media Links

**Settings Page:**
- New "Social Media" section
- Fields for:
  - Discord (username#1234 or invite link)
  - Telegram (@username)
  - X/Twitter (@username)
  - Instagram (@username)
- Saved to `social_links` JSONB column

**Public Profile:**
- Displays social links as icon buttons
- Uses Lucide React icons:
  - `MessageCircle` for Discord & Telegram
  - `Twitter` for X
  - `Instagram` for Instagram
- Links open in new tab
- Clean, hoverable button design

### 3. Navigation

**Navbar Update:**
- Added "My Feed" link (visible only when signed in)
- Positioned between "Community" and admin links
- Links to `/feed`

## File Changes

### New Files:
- `app/feed/page.tsx` - Follower feed page
- `supabase-social-links.sql` - Database migration
- `supabase-follower-feed-view.sql` - Optional view (not required)

### Modified Files:
- `app/actions/profile-actions.ts` - Added `socialLinks` parameter
- `app/settings/page.tsx` - Fetch `social_links` from profile
- `components/profile/ProfileSettingsForm.tsx` - Added social media fields
- `app/u/[username]/page.tsx` - Display social links with icons
- `components/layout/Navbar.tsx` - Added "My Feed" link

## Social Links Format

The `social_links` JSONB column stores:

```json
{
  "discord": "username#1234" or "https://discord.gg/invite",
  "telegram": "username",
  "x": "username",
  "instagram": "username"
}
```

**URL Generation:**
- Discord: If starts with `http`, use as-is. Otherwise, `https://discord.com/users/{value}`
- Telegram: `https://t.me/{username}`
- X: `https://x.com/{username}`
- Instagram: `https://instagram.com/{username}`

## Testing Checklist

### Social Media Links
- [ ] Run SQL migration for `social_links` column
- [ ] Navigate to `/settings`
- [ ] Fill in Discord, Telegram, X, Instagram fields
- [ ] Save changes
- [ ] Visit your profile (`/u/your-username`)
- [ ] Verify social links appear as icon buttons
- [ ] Click each link - should open in new tab
- [ ] Verify icons match platforms

### Follower Feed
- [ ] Navigate to `/feed` (should require login)
- [ ] If not following anyone, see "Recommended Contributors"
- [ ] Click "View Profile" on a contributor
- [ ] Follow a user from their profile
- [ ] Return to `/feed`
- [ ] Should now see activity from followed user
- [ ] Verify reviews show protocol links
- [ ] Verify discussions show tags

### Navigation
- [ ] Check navbar - "My Feed" link visible when signed in
- [ ] Click "My Feed" - should go to `/feed`
- [ ] Sign out - "My Feed" link should disappear

## Feed Query Logic

The feed page:
1. Checks if user is following anyone
2. If yes: Queries `reviews` and `discussions` tables filtered by `following_ids`
3. If no: Queries `profiles` table sorted by `contributor_score` DESC
4. Combines and sorts activities by `created_at` DESC
5. Limits to 50 items

## Notes

- Social links are optional (all fields can be empty)
- The feed shows both reviews and discussions from followed users
- Recommended contributors excludes the current user
- Social links use clean icon buttons with hover effects
- All links open in new tabs with `target="_blank"` and `rel="noopener noreferrer"`


