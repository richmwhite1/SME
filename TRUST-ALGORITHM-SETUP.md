# Trust Algorithm Setup Instructions

## Database Setup Required

The Trust Algorithm uses an **atomic Postgres function** to ensure data integrity across three operations:
1. Insert vote into `helpful_votes` table
2. Increment `helpful_count` on the `reviews` table
3. Increment `healer_score` on the `profiles` table

### Step 1: Create the Postgres Function

Run the SQL in `supabase-vote-function.sql` in your Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase-vote-function.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify Required Tables

Make sure you have these tables with the following columns:

**`helpful_votes`** table:
- `id` (UUID, primary key, auto-generated)
- `review_id` (UUID, foreign key to reviews.id)
- `user_id` (TEXT, the Clerk user ID)
- `created_at` (timestamp, auto-generated)
- **Unique constraint**: (review_id, user_id) - prevents duplicate votes

**`reviews`** table needs:
- `helpful_count` (INTEGER, default 0)

**`profiles`** table needs:
- `healer_score` (INTEGER, default 0)

### Step 3: Create the `helpful_votes` Table (if not exists)

If you don't have the `helpful_votes` table yet, run this SQL:

```sql
CREATE TABLE IF NOT EXISTS helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review_id ON helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_id ON helpful_votes(user_id);
```

### Step 4: Add Missing Columns (if needed)

If `helpful_count` or `healer_score` columns are missing:

```sql
-- Add helpful_count to reviews if it doesn't exist
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Add healer_score to profiles if it doesn't exist (you may have done this already)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS healer_score INTEGER DEFAULT 0;
```

### Step 5: Disable RLS on `helpful_votes` (if needed)

Since we're using Clerk for auth:

```sql
ALTER TABLE helpful_votes DISABLE ROW LEVEL SECURITY;
```

## Features Implemented

### 1. Voting System
- Users can mark reviews as "Helpful"
- Atomic transaction ensures data integrity
- Prevents duplicate votes (one vote per user per review)
- Updates happen instantly with optimistic UI

### 2. Trust Algorithm
- Reviews sorted by `helpful_count` (DESC) first, then by `created_at` (DESC)
- Most helpful reviews appear at the top
- Authors gain "Healer Score" when their reviews are marked helpful

### 3. Trusted Healer Badge
- Users with `healer_score > 10` display a moss-green "Trusted Healer" badge
- Badge appears next to the user's name on their reviews

### 4. UI Updates
- "Helpful" button with ThumbsUp icon on each review
- Vote count displayed: "Helpful (X)"
- Button disabled for logged-out users and after voting
- Visual feedback when voted (filled icon, green background)

## Testing

After running the SQL setup:

1. Navigate to a protocol page
2. Submit a review (if you haven't already)
3. Click "Helpful" on another user's review
4. The count should increment immediately
5. Check that you can't vote twice on the same review
6. Verify the review author's Healer Score increases
7. When a user reaches Healer Score > 10, they should see the "Trusted Healer" badge

## Notes

- The atomic transaction ensures all three database operations succeed or fail together
- This prevents inconsistent states (e.g., incrementing a count without recording the vote)
- The Postgres function runs entirely on the database server, ensuring thread-safety



