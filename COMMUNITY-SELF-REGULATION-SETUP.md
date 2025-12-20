# Community Self-Regulation Setup

## Overview

Community self-regulation allows signed-in users to flag inappropriate comments in discussion threads. When a comment receives 3 flags, it is automatically hidden. Admins can review and restore flagged comments through the moderation queue.

## Features Implemented

### 1. Flag Action ✅

**Location**: `components/discussions/DiscussionComments.tsx` (CommentThread component)

- **Flag Button**: Small flag icon/button next to the "Reply" button
- **Constraint**: Only visible to signed-in users (`isSignedIn`)
- **Server Action**: `flagComment(commentId, discussionSlug)` in `app/actions/discussion-actions.ts`
- **Database**: Updates `discussion_comments.flag_count` and sets `is_flagged = true` at 3 flags

### 2. Auto-Hide UX ✅

**Behavior**:
- After successful flag: Shows toast "Signal reported. Thank you for maintaining laboratory quality."
- If comment reaches 3 flags (`is_flagged = true`): Comment disappears from view
- Page automatically refreshes after 1 second to remove hidden comments
- Comments are filtered out in queries: `.or("is_flagged.eq.false,is_flagged.is.null")`

### 3. Binary Indent Firewall ✅

**Status**: Verified and locked

**Implementation**:
- Root comments (`depth === 0`): `ml-0` (0px margin)
- Nested comments (`depth > 0`): `ml-5` (20px margin, 1.25rem)
- Recursive depth is locked to `depth={1}` for all nested comments (never increments)
- CSS firewall in `app/globals.css` provides additional protection:
  ```css
  .comment-root { margin-left: 0 !important; }
  .comment-nested { margin-left: 20px !important; }
  .comment-nested .comment-nested { margin-left: 20px !important; }
  ```

**Result**: No matter how deep the nesting, indentation never exceeds 20px.

### 4. "Replying to @user" Bridge ✅

**Status**: Present for all nested comments

**Implementation**:
- Shows when `depth > 0 && comment.parent_id !== null`
- Displays: `Replying to @{parentUsername}`
- Parent username sourced from: `comment.parent?.profiles?.username || comment.parent?.profiles?.full_name || "user"`
- Styled with SME Gold color and monospace font

### 5. Admin Moderation Queue ✅

**Route**: `/admin/moderation`

**Features**:
- Admin-only access (redirects non-admins to homepage)
- Displays all flagged discussion comments and product comments
- Shows flag count, author info, discussion/product link, and comment content
- **Restore Action**: Resets `flag_count = 0` and `is_flagged = false`
- **Delete Action**: Permanently removes comment (with confirmation)
- Sorted by flag count (highest first), then by creation date

## Database Schema

The `discussion_comments` table includes:
- `flag_count INTEGER DEFAULT 0` - Number of times flagged
- `is_flagged BOOLEAN DEFAULT false` - Auto-set to `true` at 3 flags

**Note**: Comments are NOT actually deleted - they're hidden. This allows admins to review and restore them.

## Server Actions

### `flagComment(commentId: string, discussionSlug: string)`

**Location**: `app/actions/discussion-actions.ts`

**Behavior**:
1. Verifies user is signed in
2. Prevents users from flagging their own comments
3. Increments `flag_count`
4. Sets `is_flagged = true` if `flag_count >= 3`
5. Revalidates paths to refresh comment list

**Returns**: `{ success: boolean, flagCount: number, isHidden: boolean }`

### `restoreComment(commentId: string, type: "discussion" | "product")`

**Location**: `app/actions/admin-actions.ts`

**Behavior**:
1. Verifies admin status
2. Resets `flag_count = 0` and `is_flagged = false`
3. Makes comment visible again

### `deleteComment(commentId: string, type: "discussion" | "product")`

**Location**: `app/actions/admin-actions.ts`

**Behavior**:
1. Verifies admin status
2. Permanently deletes comment from database
3. Requires confirmation dialog

## UI Components

### Flag Button

```tsx
{isSignedIn && !isFlagged && (
  <button
    type="button"
    onClick={handleFlag}
    disabled={flagging}
    className="flex items-center gap-1 text-xs text-bone-white/50 hover:text-amber-500 font-mono transition-colors active:scale-95 disabled:opacity-50"
    title="Flag inappropriate content"
  >
    {flagging ? (
      <Loader2 size={12} className="animate-spin" />
    ) : (
      <Flag size={12} />
    )}
    <span>Flag</span>
  </button>
)}
```

**Styling**:
- Muted gray by default (`text-bone-white/50`)
- Amber on hover (`hover:text-amber-500`)
- Shows loading spinner when flagging
- Hidden if comment is already flagged

## Testing Checklist

### Flag Functionality
- [ ] Flag button appears for signed-in users only
- [ ] Flag button hidden for guest users
- [ ] Flag button hidden for comment author (can't flag own comments)
- [ ] Flagging increments flag_count
- [ ] Toast appears: "Signal reported. Thank you for maintaining laboratory quality."
- [ ] At 3 flags, comment disappears from view
- [ ] Page refreshes automatically when comment is hidden

### Indentation
- [ ] Root comments have 0px margin (`ml-0`)
- [ ] Nested comments have exactly 20px margin (`ml-5`)
- [ ] Deeply nested comments (3+ levels) still have only 20px margin
- [ ] No "staircase" effect

### Signal Bridge
- [ ] "Replying to @user" appears for all nested comments
- [ ] Shows correct parent username
- [ ] Styled with SME Gold color
- [ ] Uses monospace font

### Admin Moderation
- [ ] `/admin/moderation` route accessible to admins only
- [ ] Non-admins redirected to homepage
- [ ] Flagged comments appear in moderation queue
- [ ] Restore button resets flags and makes comment visible
- [ ] Delete button permanently removes comment (with confirmation)
- [ ] Comments sorted by flag count (highest first)

## Files Modified

1. **`app/actions/discussion-actions.ts`**
   - Added `flagComment()` server action

2. **`app/actions/admin-actions.ts`**
   - Added `restoreComment()` server action
   - Added `deleteComment()` server action

3. **`components/discussions/DiscussionComments.tsx`**
   - Added Flag button to CommentThread component
   - Added flag handler with toast and refresh logic
   - Verified binary indent firewall (ml-0 for depth=0, ml-5 for depth>0)
   - Verified "Replying to @user" bridge

4. **`app/admin/moderation/page.tsx`** (NEW)
   - Admin moderation queue page

5. **`components/admin/ModerationClient.tsx`** (NEW)
   - Client component for moderation queue UI
   - Restore and delete actions

## Security

- **Authentication**: Only signed-in users can flag comments
- **Self-Flag Prevention**: Users cannot flag their own comments
- **Admin Protection**: All moderation actions verify admin status server-side
- **Route Protection**: `/admin/moderation` redirects non-admins

## Future Enhancements

- [ ] Flag reason selection (spam, harassment, misinformation, etc.)
- [ ] Flag history tracking (who flagged, when)
- [ ] Auto-moderation based on flag patterns
- [ ] Notification to comment author when flagged
- [ ] Appeal process for flagged comments


