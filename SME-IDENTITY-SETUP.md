# SME Identity Layer - Setup Guide

## Overview

The SME Identity layer allows users to:
- Edit their profiles with rich information
- View public profiles via username URLs
- Follow/unfollow other users
- See user activity (reviews, protocols)

## Database Setup

### Step 1: Add Username Field

Run this SQL in Supabase SQL Editor:

```sql
-- Add username column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup ON profiles(username);
```

Or use the file: `supabase-username-field.sql`

## Features

### 1. Settings Page (`/settings`)

**Protected Route:**
- Only accessible to authenticated users
- Redirects to homepage if not logged in

**Profile Fields:**
- Full Name
- Username (unique, 3-20 chars, alphanumeric + dashes/underscores)
- Bio (textarea)
- Credentials (e.g., "Certified Nutritionist")
- Website URL
- Instagram Handle (without @)

**Avatar:**
- Uses Clerk's `<UserButton />` for profile picture management
- Syncs Clerk avatar URL to Supabase automatically

**Server Action:**
- `updateProfile()` - Validates username uniqueness, updates all fields

### 2. Public Profile (`/u/[username]`)

**Dynamic Route:**
- Accessible at `/u/username`
- Shows 404 if username doesn't exist

**Profile Header:**
- Large avatar (120x120)
- Full name with credentials badge
- Username (@username)
- Bio text
- Website and Instagram links
- Stats: Followers, Following, Healer Score
- "Trusted Healer" badge if score > 10

**Action Buttons:**
- **Own Profile**: "Edit Profile" button → `/settings`
- **Other Profile**: "Follow" / "Unfollow" button
- **Not Logged In**: "Sign in to Follow" button

**Server Action:**
- `toggleFollow(targetUserId)` - Creates/deletes follow relationship

### 3. Activity Tab

**Shows:**
- User's recent reviews (last 10)
- Each review shows:
  - Protocol title (linked)
  - Star rating
  - Review content
  - Time ago
- Empty state if no activity

## File Structure

### New Files:
- `app/settings/page.tsx` - Settings page
- `app/u/[username]/page.tsx` - Public profile page
- `app/u/[username]/not-found.tsx` - 404 for profiles
- `app/actions/profile-actions.ts` - updateProfile, toggleFollow
- `components/profile/ProfileSettingsForm.tsx` - Settings form
- `components/profile/ProfileFollowButton.tsx` - Follow/unfollow button
- `components/profile/ProfileActivity.tsx` - Activity display
- `supabase-username-field.sql` - Database migration

## Usage

### Setting Up Your Profile

1. Navigate to `/settings`
2. Fill in your profile information
3. Set a unique username (e.g., "dr-sarah-smith")
4. Click "Save Changes"
5. Your profile will be available at `/u/your-username`

### Viewing Profiles

1. Navigate to `/u/username` (replace with actual username)
2. See profile header with all info
3. Click "Follow" to follow the user
4. View their activity below

### Following Users

1. Visit any user's profile
2. Click "Follow" button
3. Button changes to "Unfollow"
4. Follower count updates

## Database Schema

### Profiles Table (Updated)

```sql
profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,  -- NEW
  bio TEXT,
  credentials TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  avatar_url TEXT,
  healer_score INT,
  is_admin BOOLEAN,
  is_verified_expert BOOLEAN
)
```

### Follows Table

```sql
follows (
  id UUID PRIMARY KEY,
  follower_id TEXT → profiles(id),
  following_id TEXT → profiles(id),
  created_at TIMESTAMPTZ
)
```

## Server Actions

### updateProfile

```typescript
await updateProfile(
  fullName: string,
  username: string,
  bio: string,
  credentials: string,
  websiteUrl: string,
  instagramHandle: string
)
```

**Features:**
- Validates username format (3-20 chars, alphanumeric + dashes/underscores)
- Checks username uniqueness (blocks if taken by another user)
- Updates all profile fields
- Revalidates profile page

### toggleFollow

```typescript
await toggleFollow(targetUserId: string)
```

**Returns:**
```typescript
{ success: true, isFollowing: boolean }
```

**Features:**
- Prevents self-following
- Creates follow relationship if not following
- Deletes follow relationship if already following
- Returns current follow status

## Testing Checklist

- [ ] Run SQL migration to add username field
- [ ] Navigate to `/settings` (should require login)
- [ ] Fill out profile form and save
- [ ] Verify username is saved
- [ ] Navigate to `/u/your-username` (should see profile)
- [ ] Test "Edit Profile" button (should go to settings)
- [ ] Test "Follow" button on another user's profile
- [ ] Verify follower count updates
- [ ] Test "Unfollow" button
- [ ] Check activity tab shows reviews
- [ ] Test username uniqueness (try duplicate username)

## Username Validation

**Rules:**
- 3-20 characters
- Letters, numbers, dashes, and underscores only
- Case-insensitive (stored as lowercase)
- Must be unique

**Examples:**
- ✅ `dr-sarah-smith`
- ✅ `nutrition_expert`
- ✅ `user123`
- ❌ `user name` (spaces not allowed)
- ❌ `@username` (special chars not allowed)
- ❌ `ab` (too short)

## Future Enhancements

1. **Protocol Contributions**: Show protocols created by user
2. **Discussion Posts**: Show discussions authored by user
3. **Profile Verification**: Admin can verify expert status
4. **Profile Analytics**: View profile views, engagement
5. **Profile Search**: Search users by username or name
6. **Following Feed**: See activity from users you follow

## Notes

- Username is optional (can be null)
- If username is not set, profile is not publicly accessible via URL
- Avatar syncs from Clerk automatically
- Follow relationships are bidirectional (you can see who follows whom)
- Activity only shows non-flagged reviews


