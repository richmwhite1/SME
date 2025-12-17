# Vibe Check & Flagging System Setup

## Overview

The platform now uses a **hybrid vibe check system**:
- **Unauthenticated (Guest) users**: Must pass AI content moderation
- **Authenticated users**: Skip AI check (trusted community members)

## Database Setup

### Step 1: Add `flag_count` Column

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
```

Or use the file: `supabase-flag-count.sql`

### Step 2: (Optional) Create Flag Increment Function

For better performance, you can create a function:

```sql
CREATE OR REPLACE FUNCTION increment_flag_count(p_review_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE reviews
  SET flag_count = COALESCE(flag_count, 0) + 1
  WHERE id = p_review_id;
END;
$$;
```

Or use the file: `supabase-flag-function.sql`

## Environment Variables

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Where to get it:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to `.env.local`

## How It Works

### 1. Review Submission (`submitReview`)

**For Unauthenticated Users:**
- Content is checked via `checkVibe()` function
- Uses OpenAI GPT-4o-mini to analyze content
- Rejects content containing:
  - Hate speech, discrimination, harassment
  - Threats or violence
  - Spam or promotional content
  - Explicit sexual content
  - Personal attacks or aggressive language
  - Harmful medical advice

**For Authenticated Users:**
- AI check is **skipped**
- Review is submitted immediately
- Trust is placed in registered community members

### 2. Flagging System (`flagReview`)

- Any user can flag a review as inappropriate
- Increments `flag_count` on the reviews table
- No UI implemented yet (backend ready)
- Can be used for moderation workflows later

## Files Created/Modified

### New Files:
- `lib/vibe-check.ts` - AI content moderation utility
- `supabase-flag-count.sql` - SQL to add flag_count column
- `supabase-flag-function.sql` - Optional SQL function for flagging

### Modified Files:
- `app/actions/review-actions.ts`:
  - Updated `submitReview()` with hybrid vibe check
  - Added `flagReview()` server action

## Testing

1. **Test Guest Vibe Check:**
   - Try submitting a review with inappropriate content while logged out
   - Should be rejected with a clear error message

2. **Test Authenticated Bypass:**
   - Log in and submit a review
   - Should bypass AI check and submit immediately

3. **Test Flagging:**
   - Call `flagReview()` action (when UI is added)
   - Verify `flag_count` increments in database

## Notes

- If `OPENAI_API_KEY` is not set, vibe check will allow all content (with a warning)
- The AI check uses GPT-4o-mini for cost efficiency
- Flagging system is ready for future UI implementation
- All operations are logged for debugging



