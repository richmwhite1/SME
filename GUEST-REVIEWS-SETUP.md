# Guest Reviews with Hybrid Moderation - Setup Guide

## Overview

The platform now supports **guest reviews** with mandatory AI moderation, while authenticated users bypass the AI check entirely.

### Key Features:
- ✅ **Guest users** can submit reviews (with display name)
- ✅ **Mandatory AI moderation** for guest reviews
- ✅ **Authenticated users** bypass AI (trusted)
- ✅ **Guest badge** displayed on guest reviews
- ✅ **Smart sorting**: Authenticated reviews appear first

## Database Setup

### Step 1: Run the SQL Migration

Open Supabase Dashboard → SQL Editor, then run:

```sql
-- Copy/paste contents of: supabase-guest-reviews.sql
```

This will:
- Add `guest_author_name` column to reviews table
- Make `user_id` nullable (if possible)
- Create index for efficient filtering

**Note:** If making `user_id` nullable fails due to constraints, you may need to:
1. Check existing foreign key constraints
2. Temporarily remove constraints, make nullable, then re-add constraints
3. Or use a default placeholder UUID for guests

## How It Works

### Guest Review Flow

```
Guest User Submits Review
         │
         ▼
Enter Display Name (required)
         │
         ▼
MANDATORY AI Vibe Check
         │
    ┌────┴────┐
    │         │
  Safe?     Unsafe?
    │         │
    ▼         ▼
Submit    Reject with
Review    AI Reason
```

### Authenticated Review Flow

```
Authenticated User Submits Review
         │
         ▼
Skip AI Check (trusted)
         │
         ▼
Submit Review Immediately
```

## Code Changes

### 1. `submitReview` Action

**New Parameters:**
- `guestAuthorName?: string` - Display name for guest reviews

**Logic:**
- If `userId` is null: Run mandatory vibe check, validate guest name, insert with `user_id = null`
- If `userId` is not null: Skip vibe check, create/update profile, insert with `user_id = userId`

### 2. `ReviewForm` Component

**New Features:**
- Shows "Display Name" field for guests
- Uses `useUser()` hook to detect authentication status
- Includes hint: "Signed-in members get 'Verified' badges and build Healer Scores. [Sign In]"
- Passes `guestAuthorName` to `submitReview` when guest

### 3. `ReviewSection` Component

**Changes:**
- Removed conditional rendering (form shown to everyone)
- Removed `ReviewFormPrompt` component
- Updated sorting: Authenticated reviews first (`user_id IS NOT NULL`), then by `helpful_count`, then `created_at`

### 4. `ReviewCard` Component

**New Features:**
- Detects guest reviews (`user_id === null`)
- Shows "Guest" badge instead of Healer Score
- Displays `guest_author_name` for guest reviews
- Falls back to profile name for authenticated reviews

## Database Schema

### Reviews Table (Updated)

```sql
reviews (
  id UUID PRIMARY KEY,
  protocol_id UUID,
  user_id TEXT NULLABLE,  -- NULL for guests
  guest_author_name TEXT NULLABLE,  -- Display name for guests
  rating INT,
  content TEXT,
  created_at TIMESTAMPTZ,
  helpful_count INT,
  flag_count INT,
  is_flagged BOOLEAN
)
```

**Constraints:**
- Either `user_id` OR `guest_author_name` should be set (not both null)
- `user_id` references `profiles(id)` when not null

## Sorting Logic

Reviews are sorted in this order:

1. **Authenticated first**: `user_id IS NOT NULL` (authenticated users)
2. **By helpfulness**: `helpful_count DESC` (most helpful first)
3. **By recency**: `created_at DESC` (newest first)

This ensures:
- Trusted community members' reviews appear at the top
- Guest reviews appear below authenticated reviews
- Within each group, most helpful/newest appear first

## UI Components

### Guest Review Form

```
┌─────────────────────────────────┐
│ Share Your Experience           │
├─────────────────────────────────┤
│ Display Name: [________]        │
│ Rating: ⭐⭐⭐⭐⭐              │
│ Your Review: [textarea]         │
│                                 │
│ [Submit Review]                 │
│                                 │
│ Signed-in members get...        │
│ [Sign In]                       │
└─────────────────────────────────┘
```

### Guest Review Card

```
┌─────────────────────────────────┐
│ [G] Guest Name [Guest Badge]    │
│                                  │
│ ⭐⭐⭐⭐⭐                        │
│ Review content...                │
│                                  │
│ [Helpful] [Flag]                 │
└─────────────────────────────────┘
```

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify `guest_author_name` column exists
- [ ] Test guest review submission:
  - [ ] Without display name (should fail)
  - [ ] With inappropriate content (should be blocked by AI)
  - [ ] With safe content (should submit successfully)
- [ ] Test authenticated review submission:
  - [ ] Should bypass AI check
  - [ ] Should create/update profile
  - [ ] Should submit immediately
- [ ] Verify sorting:
  - [ ] Authenticated reviews appear first
  - [ ] Guest reviews appear below
- [ ] Verify UI:
  - [ ] Guest badge shows on guest reviews
  - [ ] Healer Score shows on authenticated reviews
  - [ ] Display name shows correctly for guests

## Security Considerations

### Guest Review Limitations

1. **No Profile**: Guests don't have profiles, so:
   - No Healer Score
   - No avatar
   - No verification badge
   - Can't vote on other reviews (requires auth)

2. **AI Moderation**: All guest content is checked
   - Prevents spam and abuse
   - Adds slight delay (API call)
   - May have false positives/negatives

3. **Display Names**: 
   - Not unique (multiple guests can use same name)
   - No verification
   - Can be changed between reviews

### Recommendations

- Consider rate limiting guest reviews per IP
- Add CAPTCHA for guest submissions (future)
- Monitor AI rejection rates
- Allow appeals for false positives (future)

## Files Modified

### New Files:
- `supabase-guest-reviews.sql` - Database migration
- `GUEST-REVIEWS-SETUP.md` - This documentation

### Modified Files:
- `app/actions/review-actions.ts` - Guest support in `submitReview`
- `components/holistic/ReviewForm.tsx` - Guest name field and hint
- `components/holistic/ReviewSection.tsx` - Always show form, updated sorting
- `components/holistic/ReviewCard.tsx` - Guest badge and display logic

## Migration Notes

If you have existing reviews:
- All existing reviews have `user_id` set (authenticated)
- `guest_author_name` will be `NULL` for existing reviews
- No data migration needed

## Future Enhancements

1. **Guest Verification**: Optional email verification for guests
2. **Rate Limiting**: Limit guest reviews per IP/time period
3. **Guest Profiles**: Allow guests to "claim" their reviews by signing up
4. **Moderation Queue**: Admin dashboard to review AI-rejected content
5. **Appeal System**: Let users contest AI rejections


