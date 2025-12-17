# Trusted Voice Badge System

## Overview
The "Trusted Voice" badge system recognizes contributors who have earned a high contributor score through helpful reviews and quality discussions.

## Features

### 1. Badge Component
- **Component**: `components/ui/TrustedVoiceBadge.tsx`
- **Icon**: ShieldCheck from lucide-react
- **Styling**: Earth-green background with badge text
- **Sizes**: sm, md, lg

### 2. Badge Display Locations
The Trusted Voice badge appears in the following places:
- **Profile Page Header**: Next to the user's name
- **Review Cards**: Next to review author names
- **Discussion Posts**: Next to discussion author names
- **Discussion Comments**: Next to comment author names
- **Hot Topics Sidebar**: Next to discussion author usernames

### 3. Badge Logic
- **Threshold**: Contributor score >= 10
- **Database Column**: `badge_type` (TEXT) in `profiles` table
- **Value**: "Trusted Voice" when threshold is met, NULL otherwise
- **Auto-Update**: Badge is automatically updated when:
  - A review receives a helpful vote
  - A discussion receives an upvote

### 4. Progress Indicator
On public profile pages, users who haven't reached Trusted Voice status see:
- A subtle info box showing how many points they need
- Message: "This contributor is X points away from becoming a Trusted Voice."

## Database Setup

### SQL Script
Run `supabase-trusted-voice-badge.sql` in the Supabase SQL Editor:

```sql
-- Adds badge_type column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_type TEXT DEFAULT NULL;

-- Creates update_user_badge function
CREATE OR REPLACE FUNCTION update_user_badge(user_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_contributor_score INTEGER;
  v_badge_type TEXT;
BEGIN
  SELECT contributor_score INTO v_contributor_score
  FROM profiles
  WHERE id = user_id_param;

  IF v_contributor_score >= 10 THEN
    v_badge_type := 'Trusted Voice';
  ELSE
    v_badge_type := NULL;
  END IF;

  UPDATE profiles
  SET badge_type = v_badge_type
  WHERE id = user_id_param;
END;
$$;
```

### Initial Badge Update
The SQL script also includes a one-time update to set badges for existing users based on their current contributor_score.

## Server Actions

### Review Votes
`app/actions/vote-actions.ts` - `markReviewHelpful`:
- After a successful vote, fetches the review author_id
- Calls `update_user_badge` RPC to update badge status

### Discussion Votes
`app/actions/discussion-actions.ts` - `toggleDiscussionVote`:
- After a successful vote (vote added, not removed), fetches the discussion author_id
- Calls `update_user_badge` RPC to update badge status

## Component Updates

### Files Modified
1. **components/ui/TrustedVoiceBadge.tsx** (NEW)
   - Reusable badge component

2. **components/holistic/ReviewCard.tsx**
   - Added `badge_type` to profile interface
   - Replaced "Trusted Contributor" text with `TrustedVoiceBadge` component
   - Checks `badge_type === "Trusted Voice"` instead of `contributor_score > 10`

3. **components/holistic/ReviewSection.tsx**
   - Added `badge_type` to profile select query

4. **app/u/[username]/page.tsx**
   - Added `badge_type` to profile interface and select query
   - Replaced "Trusted Contributor" with `TrustedVoiceBadge` component
   - Added progress indicator for users not yet Trusted Voice

5. **app/discussions/[slug]/page.tsx**
   - Added `badge_type` to discussion and comment profile selects
   - Added `TrustedVoiceBadge` next to discussion author name

6. **components/discussions/DiscussionComments.tsx**
   - Added `badge_type` to comment profile interface
   - Added `TrustedVoiceBadge` next to comment author names

7. **components/HotTopics.tsx**
   - Added `badge_type` to profile select query
   - Added `TrustedVoiceBadge` next to discussion author usernames

8. **app/actions/vote-actions.ts**
   - Added `update_user_badge` RPC call after successful review vote

9. **app/actions/discussion-actions.ts**
   - Added `update_user_badge` RPC call after successful discussion vote

## Branding Changes

### Replaced Terms
- "Trusted Contributor" → "Trusted Voice"
- "Signal Master" → "Trusted Voice" (if any existed)
- "Verified" → "Trusted Voice" (if any existed)

### Badge Threshold
- **Previous**: `contributor_score > 10` (hardcoded check)
- **Current**: `badge_type === "Trusted Voice"` (database-driven)

## Testing Checklist

- [ ] Run SQL script in Supabase
- [ ] Verify badge appears on profile page for users with score >= 10
- [ ] Verify badge appears on review cards
- [ ] Verify badge appears on discussion posts
- [ ] Verify badge appears on comments
- [ ] Verify badge appears in Hot Topics sidebar
- [ ] Verify progress indicator shows correct points remaining
- [ ] Test badge update after voting on a review
- [ ] Test badge update after upvoting a discussion
- [ ] Verify badge disappears if score drops below 10 (edge case)

## Notes

- The badge system is database-driven for better performance and consistency
- Badge updates happen asynchronously after votes (non-blocking)
- The `update_user_badge` function can be called manually or via triggers in the future
- Badge status is cached in the `badge_type` column to avoid recalculating on every query

