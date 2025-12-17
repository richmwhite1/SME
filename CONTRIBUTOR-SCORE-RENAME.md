# Contributor Score Rename - Complete

## Overview

Renamed "Healer Score" to "Contributor Score" throughout the application and customized the UserButton menu with profile links.

## Database Migration

### Step 1: Run SQL Migration

Run `supabase-rename-contributor-score.sql` in Supabase SQL Editor:

```sql
ALTER TABLE profiles RENAME COLUMN healer_score TO contributor_score;
```

This also updates the `mark_review_helpful` function to use `contributor_score`.

## Changes Made

### 1. Database
- ✅ Column renamed: `healer_score` → `contributor_score`
- ✅ Postgres function updated to use `contributor_score`

### 2. Frontend Components
- ✅ `ReviewCard.tsx` - Updated to use `contributor_score`
- ✅ `ReviewSection.tsx` - Updated query to fetch `contributor_score`
- ✅ `app/u/[username]/page.tsx` - Updated profile page
- ✅ `app/actions/review-actions.ts` - Updated profile creation

### 3. UI Text Updates
- ✅ "Healer Score" → "Contributor Score"
- ✅ "Trusted Healer" → "Trusted Contributor"
- ✅ Badge threshold remains at > 10

### 4. UserButton Customization
- ✅ Added "My Public Profile" link (`/u/me`) with User icon
- ✅ Added "Edit Profile Settings" link (`/settings`) with Settings icon
- ✅ Removed standalone "Settings" link from navbar (now in UserButton menu)

### 5. Profile Redirect Route
- ✅ Created `/u/me` route that:
  - Fetches current user's username from Supabase
  - Redirects to `/u/[username]` if username exists
  - Redirects to `/settings` if no username is set

## Files Modified

1. `supabase-rename-contributor-score.sql` - Database migration
2. `components/holistic/ReviewCard.tsx` - Updated score references
3. `components/holistic/ReviewSection.tsx` - Updated query
4. `app/u/[username]/page.tsx` - Updated profile display
5. `app/actions/review-actions.ts` - Updated profile creation
6. `components/layout/Navbar.tsx` - Customized UserButton menu
7. `app/u/me/page.tsx` - New redirect route

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify profile pages show "Contributor Score" instead of "Healer Score"
- [ ] Verify "Trusted Contributor" badge appears for users with score > 10
- [ ] Click UserButton → "My Public Profile" (should redirect to `/u/username`)
- [ ] Click UserButton → "Edit Profile Settings" (should go to `/settings`)
- [ ] Test `/u/me` redirect when username is set
- [ ] Test `/u/me` redirect when username is NOT set (should go to settings)
- [ ] Verify voting still increments contributor_score correctly

## Notes

- The badge threshold (score > 10) remains unchanged
- All existing scores are preserved (just column renamed)
- The UserButton menu now provides quick access to profile and settings
- The `/u/me` route provides a convenient shortcut to your own profile


