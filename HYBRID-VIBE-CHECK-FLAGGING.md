# Hybrid Vibe Check & Flagging System

## Overview

The platform now has a two-tier content moderation system:

### 1. Hybrid Vibe Check (AI Moderation)
- **Guest Users**: Content is checked by AI before submission
- **Authenticated Users**: Trusted, bypass AI check

### 2. Community Flagging System
- Any user can flag inappropriate reviews
- Reviews with 3+ flags are automatically hidden
- Flagged reviews disappear from the UI

## Database Setup

### Step 1: Run the Flagging SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy/paste contents of: supabase-flagging-autohide.sql
```

This will:
- Add `is_flagged` column to reviews table
- Create `flag_review_and_auto_hide()` function for atomic flagging

**OR manually run:**

```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged ON reviews(is_flagged);
```

## How It Works

### AI Moderation (Vibe Check)

**For Guest Users:**
1. User submits a review without being logged in
2. Content is sent to OpenAI GPT-4o-mini
3. AI returns: `{ "isSafe": boolean, "reason": string }`
4. If unsafe: Review is rejected with reason shown to user
5. If safe: Review is submitted

**For Authenticated Users:**
1. User is logged in via Clerk
2. AI check is **skipped entirely**
3. Review is submitted immediately
4. Trust is placed in registered community members

### Flagging System

**User Experience:**
1. Every review has a small "Flag" button in the bottom-right
2. Click "Flag" to report inappropriate content
3. Button changes to "Flagged" after clicking (can't flag twice)

**Backend Logic:**
1. `flagReview()` server action increments `flag_count`
2. If `flag_count >= 3`: Sets `is_flagged = true`
3. Flagged reviews are filtered out in `ReviewSection`
4. Review disappears from UI immediately after flagging

## Code Structure

### 1. Vibe Check Utility (`lib/vibe-check.ts`)

```typescript
export interface VibeCheckResult {
  isSafe: boolean;
  reason: string;
}

export async function checkVibe(content: string): Promise<VibeCheckResult>
```

**Features:**
- Uses OpenAI GPT-4o-mini for cost efficiency
- Strict filter for: hate speech, spam, aggression, threats, harassment
- Returns JSON with safety status and reason
- Graceful error handling (defaults to safe on API error)

### 2. Submit Review Action (`app/actions/review-actions.ts`)

```typescript
export async function submitReview(
  protocolId: string,
  rating: number,
  content: string,
  protocolSlug?: string
)
```

**Logic Flow:**
1. Check authentication with `auth()` from Clerk
2. If guest: Run `checkVibe(content)`
   - If unsafe: Throw error with AI's reason
   - If safe: Continue
3. If authenticated: Skip vibe check
4. Create/update user profile (just-in-time sync)
5. Insert review into database

### 3. Flag Review Action (`app/actions/review-actions.ts`)

```typescript
export async function flagReview(
  reviewId: string,
  protocolSlug?: string
)
```

**Logic Flow:**
1. Try RPC function `flag_review_and_auto_hide()`
2. If RPC doesn't exist: Manual logic
   - Fetch current `flag_count`
   - Increment by 1
   - If new count >= 3: Set `is_flagged = true`
3. Revalidate protocol page

### 4. Review Section (`components/holistic/ReviewSection.tsx`)

**Filter Query:**
```typescript
.eq("is_flagged", false) // Only show non-flagged reviews
```

### 5. Review Card (`components/holistic/ReviewCard.tsx`)

**New UI Elements:**
- Flag button with `<Flag />` icon
- Muted styling (small, bottom-right)
- Disabled after flagging with "Flagged" text
- Optimistic UI (button updates immediately)

## Testing

### Test 1: Guest Vibe Check (Unsafe Content)

1. Log out
2. Try submitting: "This product is garbage and the creator is an idiot"
3. Should be blocked with reason from AI

### Test 2: Guest Vibe Check (Safe Content)

1. Log out (if you can submit as guest - might need to adjust logic)
2. Submit: "This protocol helped me sleep better after 3 days"
3. Should pass and be submitted

### Test 3: Authenticated Bypass

1. Log in
2. Submit any review (even negative)
3. Should bypass AI and submit immediately

### Test 4: Flagging System

1. Create a test review
2. Click "Flag" button 3 times (from 3 different accounts or sessions)
3. After 3rd flag, review should disappear from UI

## Environment Variables

Ensure `.env.local` has:

```env
OPENAI_API_KEY=sk-proj-your-key-here
```

## Files Modified

### New Files:
- `supabase-flagging-autohide.sql` - SQL for is_flagged column and function
- `HYBRID-VIBE-CHECK-FLAGGING.md` - This documentation

### Modified Files:
- `lib/vibe-check.ts` - Updated to return JSON with reason
- `app/actions/review-actions.ts`:
  - Updated `submitReview()` with hybrid check
  - Updated `flagReview()` with auto-hide at 3 flags
- `components/holistic/ReviewSection.tsx`:
  - Added `is_flagged` to interface
  - Filter query: `.eq("is_flagged", false)`
- `components/holistic/ReviewCard.tsx`:
  - Added Flag icon import
  - Added flag button with state management
  - Updated layout to show both buttons

## SQL Functions

### flag_review_and_auto_hide()

```sql
CREATE OR REPLACE FUNCTION flag_review_and_auto_hide(p_review_id UUID)
RETURNS JSON
```

**What it does:**
1. Increments `flag_count` by 1
2. If count >= 3: Sets `is_flagged = true`
3. Returns JSON with success status and counts

**Why atomic:**
- No race conditions
- Multiple users can flag simultaneously
- Guaranteed consistency

## Security Notes

### Why Trust Authenticated Users?

1. **Accountability**: Registered users have profiles tied to their actions
2. **Barrier to Entry**: Creating fake accounts is harder than anonymous posting
3. **Community Self-Policing**: Flagging system catches bad actors
4. **Cost Efficiency**: Avoid AI costs for trusted community members

### Vibe Check Limitations

- AI is not perfect (false positives/negatives possible)
- Defaults to "safe" on API errors (avoid blocking legitimate users)
- Consider manual review queue for flagged content in production

## Future Enhancements

1. **Admin Dashboard**: View flagged reviews
2. **Appeal System**: Let users contest AI rejections
3. **Flag Reasons**: Let users specify why they're flagging
4. **Rate Limiting**: Prevent flag abuse
5. **Auto-Ban**: Hide all reviews from users with multiple flagged reviews

## Monitoring

Log these events:
- AI rejections (what content is being blocked?)
- API errors (is OpenAI down?)
- Flag counts (are certain reviews getting mass-flagged?)
- False positives (legitimate reviews blocked by AI)

## Cost Estimates

**OpenAI GPT-4o-mini:**
- ~$0.00015 per review check
- 10,000 guest reviews = ~$1.50/month
- Authenticated users = $0 (bypassed)


