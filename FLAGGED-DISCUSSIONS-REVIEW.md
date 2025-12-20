# Flagged Discussions Review System

## Overview

The platform uses a community-driven flagging system where users can flag inappropriate content. When content receives 3 or more flags, it is automatically hidden and moved to the moderation queue for admin review.

## How Flagging Works

### 1. User Flagging
- **Location**: Any discussion or comment can be flagged by clicking the "Flag" button
- **Action**: Each flag increments the `flag_count` in the database
- **Auto-Hide**: When `flag_count >= 3`, the content is automatically:
  - Set to `is_flagged = true`
  - Hidden from all public views
  - Moved to the `moderation_queue` table

### 2. What Gets Flagged
The system tracks flags for:
- **Discussions** (`discussions` table)
- **Discussion Comments** (`discussion_comments` table)
- **Product Comments** (`product_comments` table)
- **Reviews** (`reviews` table)

## Admin Review Process

### Location: `/admin/moderation`

**Route**: `app/admin/moderation/page.tsx`

This is the **Moderation Laboratory** where admins review all flagged content.

### Features

1. **Queue Display**
   - Shows all items in the `moderation_queue` table
   - Displays flag count, author info, content, and timestamps
   - Links to the original discussion/product

2. **Statistics Dashboard**
   - **Total Queued**: All items awaiting review
   - **High Priority**: Items with 3+ flags (auto-hidden)
   - **Pending Review**: Items with 1-2 flags (not yet auto-hidden)

3. **Admin Actions**

   **RESTORE** (Green Button):
   - Removes the item from moderation queue
   - Resets `flag_count` to 0
   - Sets `is_flagged = false`
   - Makes the content visible again
   - **Use when**: Content was flagged incorrectly or is acceptable

   **PURGE** (Red Button):
   - Permanently deletes the content from the archive
   - Requires confirmation dialog
   - **Use when**: Content is clearly inappropriate and should be removed

### Access Control

- **Admin Only**: Route is protected by `isAdmin()` check
- **Redirect**: Non-admins are redirected to home page
- **Server Actions**: All moderation actions are server-side and require admin status

## Database Structure

### Moderation Queue Table

```sql
moderation_queue (
  id UUID PRIMARY KEY,
  original_comment_id UUID,
  comment_type TEXT, -- 'discussion' or 'product'
  discussion_id UUID,
  protocol_id UUID,
  author_id UUID,
  guest_name TEXT,
  content TEXT,
  flag_count INTEGER,
  original_created_at TIMESTAMP,
  queued_at TIMESTAMP,
  parent_id UUID
)
```

### Flagging Columns

All content tables have:
- `flag_count INTEGER DEFAULT 0` - Number of flags received
- `is_flagged BOOLEAN DEFAULT false` - Auto-hidden status

## Code Locations

### Server Actions
- **File**: `app/actions/admin-actions.ts`
- **Functions**:
  - `getModerationQueue()` - Fetches all queued items
  - `restoreFromQueue(queueItemId)` - Restores flagged content
  - `purgeFromQueue(queueItemId)` - Permanently deletes content
  - `getFlaggedContent()` - Gets all flagged content across site

### UI Components
- **Page**: `app/admin/moderation/page.tsx` - Main moderation page
- **Client Component**: `components/admin/ModerationClient.tsx` - Interactive queue display

### Flagging Actions
- **Discussions**: `app/actions/discussion-actions.ts` - `flagDiscussion()`, `flagComment()`
- **Reviews**: `app/actions/review-actions.ts` - `flagReview()`
- **Product Comments**: `app/actions/product-actions.ts` - `flagProductComment()`

## Workflow Example

1. **User flags a discussion comment** → `flag_count` increments
2. **Comment reaches 3 flags** → Auto-moved to `moderation_queue`, hidden from view
3. **Admin visits `/admin/moderation`** → Sees comment in queue
4. **Admin reviews content** → Reads the comment, checks context
5. **Admin decision**:
   - **Restore**: If content is acceptable, click RESTORE
   - **Purge**: If content is inappropriate, click PURGE (with confirmation)

## Visual Design

The moderation page uses the app's dark theme:
- **Background**: `bg-forest-obsidian` (dark)
- **Text**: `text-bone-white` (light)
- **Borders**: `border-translucent-emerald` (emerald green)
- **Cards**: `bg-bone-white/5` (semi-transparent)
- **Font**: `font-mono` (monospace for technical feel)

## Related Documentation

- `ADMIN-MODERATION-SETUP.md` - Setup instructions
- `COMMUNITY-SELF-REGULATION-SETUP.md` - Community flagging details
- `MODERATION-SME-FREEDOM.md` - Moderation philosophy


