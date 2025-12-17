# Discussion Delete & Upvote System - Complete ✅

## Features Implemented

### 1. ✅ Owner Delete (Discussion Only)

**Security:** Strictly enforced - only the author can delete their own discussion

**Server Action:** `deleteDiscussion(discussionId, discussionSlug)`
- Verifies user authentication
- **Checks ownership:** `discussion.author_id === userId`
- Deletes discussion from database
- Comments cascade delete automatically (verified)
- Revalidates `/discussions` and `/feed` paths

**UI Component:** `DeleteDiscussionButton`
- Red Trash2 icon button
- Only visible to discussion owner
- Confirmation dialog: "Are you sure?"
- Loading state while deleting
- Auto-redirects to `/discussions` after deletion

---

### 2. ✅ Upvote System (Positive Signal Only)

**Database:**
- New table: `discussion_votes` 
  - `user_id` + `discussion_id` unique constraint (one vote per user)
  - ON DELETE CASCADE for cleanup
- New column: `discussions.upvote_count` (cached count for performance)
- Atomic function: `toggle_discussion_vote()` (handles vote + count update)

**Server Action:** `toggleDiscussionVote(discussionId)`
- Checks user authentication
- Calls atomic SQL function to:
  - Add vote if not voted → increment count
  - Remove vote if voted → decrement count
- Returns vote state and new count

**UI Component:** `UpvoteButton`
- ArrowBigUp icon from Lucide
- **Filled icon** when voted (earth-green background)
- **Outline icon** when not voted (white background)
- Shows vote count
- Optimistic UI (instant feedback)
- Loading state while voting
- Sign-in prompt for guests

---

### 3. ✅ Cascade Delete Audit

**Verified:** `discussion_comments` table has `ON DELETE CASCADE`

**From `supabase-discussion-comments.sql`:**
```sql
discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE
```

**Verification Query (included in SQL):**
```sql
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'discussion_comments';
```

**Result:** When a discussion is deleted, all associated comments are automatically deleted.

---

## Database Setup (REQUIRED)

Run `supabase-discussion-votes.sql` in Supabase SQL Editor:

```sql
-- 1. Create discussion_votes table
CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_discussion_vote UNIQUE (user_id, discussion_id)
);

-- 2. Add upvote_count column
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- 3. Create atomic toggle function
CREATE OR REPLACE FUNCTION toggle_discussion_vote(...) ...

-- 4. Disable RLS
ALTER TABLE discussion_votes DISABLE ROW LEVEL SECURITY;
```

---

## Files Created

### Server Actions
- ✅ `app/actions/discussion-actions.ts` (updated)
  - `deleteDiscussion()` - Owner-only delete with security checks
  - `toggleDiscussionVote()` - Toggle vote with optimistic updates

### Components
- ✅ `components/discussions/DeleteDiscussionButton.tsx` - Delete button with confirmation
- ✅ `components/discussions/UpvoteButton.tsx` - Upvote button with state

### Database
- ✅ `supabase-discussion-votes.sql` - Complete migration for upvote system

### Updated Files
- ✅ `app/discussions/[slug]/page.tsx` - Added delete & upvote buttons, vote checking

---

## UI Layout

### Discussion Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Discussions                                       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Title                            [Delete] [Flag]     │  │
│  │  By @username • 2 hours ago                          │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  [↑ 5] ← Upvote Button                               │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Discussion content goes here...                     │  │
│  │                                                       │  │
│  │  🏷️ tag1  🏷️ tag2                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Comments Section...                                         │
└─────────────────────────────────────────────────────────────┘
```

**Button Visibility:**
- **Delete Button:** Only visible to discussion owner (red)
- **Flag Button:** Visible to everyone (gray)
- **Upvote Button:** Visible to everyone
  - Green background when voted
  - White background when not voted

---

## Features

### Delete Discussion

**Security:**
- ✅ Strict ownership check
- ✅ Auth required
- ✅ Confirmation dialog
- ✅ Cannot be undone

**Flow:**
1. User clicks red "Delete" button
2. Confirmation: "Are you sure? This action cannot be undone."
3. If confirmed → server action checks ownership
4. Discussion deleted from database
5. Comments cascade delete
6. User redirected to `/discussions` list
7. Paths revalidated

### Upvote Discussion

**Features:**
- ✅ One vote per user per discussion
- ✅ Toggle vote (click to add, click again to remove)
- ✅ Optimistic UI (instant feedback)
- ✅ Atomic updates (no race conditions)
- ✅ Cached count (performance)

**Flow:**
1. User clicks upvote button
2. Optimistic update (immediate visual feedback)
3. Server action toggles vote + updates count
4. Page revalidates with actual state
5. If error → revert optimistic update

---

## Testing Checklist

### Delete Discussion
- [ ] Only owner sees delete button
- [ ] Non-owners don't see delete button
- [ ] Confirmation dialog appears on click
- [ ] Canceling confirmation does nothing
- [ ] Confirming deletes discussion
- [ ] Comments are also deleted
- [ ] Redirect to `/discussions` works
- [ ] Deleted discussion doesn't appear in feed
- [ ] Non-owner attempting delete (via API) is blocked

### Upvote System
- [ ] Upvote button visible to all users
- [ ] Clicking adds vote (icon fills, count increments)
- [ ] Clicking again removes vote (icon outlines, count decrements)
- [ ] Count updates correctly
- [ ] Can't vote more than once
- [ ] Guest users see "sign in to vote" message
- [ ] Optimistic UI works (instant feedback)
- [ ] Vote persists on page reload
- [ ] Vote state correct after upvoting on multiple discussions

### Cascade Delete
- [ ] Create discussion with comments
- [ ] Delete discussion
- [ ] Verify comments are also deleted (check database)
- [ ] No orphaned comments remain

---

## API Security

### Delete Endpoint
```typescript
// SECURITY CHECKS:
1. User must be authenticated
2. Discussion must exist
3. User ID must match discussion.author_id
4. If any check fails → Error thrown
```

### Vote Endpoint
```typescript
// SECURITY CHECKS:
1. User must be authenticated
2. Discussion must exist
3. Database enforces unique constraint (one vote per user)
```

---

## Database Schema

### discussion_votes
```sql
id          UUID    PRIMARY KEY
user_id     TEXT    REFERENCES profiles(id)
discussion_id UUID  REFERENCES discussions(id)
created_at  TIMESTAMP
UNIQUE(user_id, discussion_id)
```

### discussions (new column)
```sql
upvote_count INTEGER DEFAULT 0
```

---

## Performance Considerations

### Cached Count
- `upvote_count` column caches total votes
- Avoids COUNT(*) queries on every page load
- Updated atomically via SQL function
- Indexed for fast sorting by popularity

### Atomic Function
- Single transaction for vote toggle + count update
- Prevents race conditions
- Consistent state guaranteed
- No manual count recalculation needed

### Indexes
```sql
idx_discussion_votes_user_id         -- Fast user vote lookup
idx_discussion_votes_discussion_id   -- Fast discussion vote lookup
idx_discussions_upvote_count         -- Fast sorting by popularity
```

---

## Future Enhancements

### Potential Features
- [ ] Sort discussions by "Hot" (upvotes + recency)
- [ ] Show "X people upvoted this" tooltip
- [ ] Trending discussions (high upvotes in short time)
- [ ] User profile: "Discussions I've upvoted"
- [ ] Leaderboard: "Most upvoted discussions"
- [ ] Email notification when discussion gets upvoted

### Not Implemented (By Design)
- ❌ Downvotes (positive signals only)
- ❌ Vote on comments (discussions only)
- ❌ Edit discussion (simpler to delete/recreate)
- ❌ Admin delete (can be added later)

---

## Troubleshooting

### Delete button not showing
**Cause:** Not the discussion owner
**Fix:** Verify `user.id === discussion.author_id`

### Delete fails with "not found"
**Cause:** Discussion already deleted or doesn't exist
**Fix:** Check if discussion exists in database

### Delete fails with "unauthorized"
**Cause:** User is not the owner
**Fix:** Security working correctly - only owners can delete

### Upvote button not working
**Cause:** Database migration not run
**Fix:** Run `supabase-discussion-votes.sql`

### Vote count not updating
**Cause:** RPC function not created or RLS enabled
**Fix:** 
1. Create `toggle_discussion_vote()` function
2. Disable RLS: `ALTER TABLE discussion_votes DISABLE ROW LEVEL SECURITY;`

### Can vote multiple times
**Cause:** Unique constraint not created
**Fix:** Drop and recreate table with UNIQUE constraint

---

## Success Indicators

When everything works:
- ✅ Owner sees red delete button on their discussions
- ✅ Non-owners don't see delete button
- ✅ Deleting a discussion removes it everywhere (list, feed, detail)
- ✅ Comments are deleted with discussion
- ✅ Upvote button shows current state (filled or outline)
- ✅ Clicking upvote toggles state immediately
- ✅ Count updates correctly
- ✅ Vote persists after refresh
- ✅ Can't vote more than once
- ✅ No errors in console

---

## Complete! 🎉

All features implemented and ready for testing:
- ✅ Owner delete with security
- ✅ Upvote system with optimistic UI
- ✅ Cascade delete verified

**Next step:** Run the database migration and test the features!

