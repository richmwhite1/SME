# Admin Moderation Dashboard - Setup Guide

## Overview

The Admin Moderation Dashboard allows administrators to review and moderate flagged content. Admins can:
- View all flagged or reported reviews
- Approve reviews (reset flags)
- Permanently delete inappropriate reviews
- See statistics and metadata

## Setup Instructions

### Step 1: Run SQL Migration

Run this SQL in Supabase SQL Editor:

```sql
-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for efficient admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
```

Or use the file: `supabase-admin-role.sql`

### Step 2: Grant Admin Role to Your User

Find your Clerk user ID:
1. Log into your app
2. Open browser console
3. Run: `console.log(window.Clerk.user.id)`
4. Copy the ID

Then run this SQL in Supabase (replace with your ID):

```sql
UPDATE profiles SET is_admin = true WHERE id = 'your-clerk-user-id-here';
```

### Step 3: Access the Dashboard

Navigate to: `http://localhost:3000/admin/moderation`

- If you're not an admin: You'll be redirected to the homepage
- If you're an admin: You'll see the moderation queue

## Features

### Security
- **Route Protection**: `/admin/moderation` checks `isAdmin()` before rendering
- **Server Action Protection**: Both `approveReview` and `deleteReview` verify admin status
- **Automatic Redirect**: Non-admins are redirected to homepage

### Moderation Queue

**Stats Dashboard:**
- Total Flagged: All reviews with flags or hidden
- Auto-Hidden: Reviews with `is_flagged = true` (3+ flags)
- Pending Review: Flagged but not auto-hidden

**Review Cards Display:**
- Author info (guest or authenticated)
- Email (for authenticated users)
- Protocol link
- Rating
- Content
- Flag count
- Time created
- Status badges (Guest, Auto-Hidden)

**Actions:**
- **Approve** (Green): Resets `is_flagged = false` and `flag_count = 0`
- **Delete** (Red): Permanently removes the review

### Empty State

When there are no flagged reviews:
```
✓ No items to moderate
  All reviews are clean. Great job, community!
```

## File Structure

### New Files:
- `lib/admin.ts` - Admin helper functions
- `app/api/check-admin/route.ts` - API endpoint for navbar
- `app/actions/moderation-actions.ts` - Server actions for moderation
- `app/admin/moderation/page.tsx` - Main moderation dashboard
- `components/admin/ModerationReviewCard.tsx` - Review card component
- `supabase-admin-role.sql` - Database migration

### Modified Files:
- `components/layout/Navbar.tsx` - Added admin link (visible to admins only)

## Usage

### As an Admin

1. **Access Dashboard:**
   - Click "Moderation" in navbar (only visible if you're admin)
   - Or navigate to `/admin/moderation`

2. **Review Flagged Content:**
   - See all reviews with flags or auto-hidden
   - Sort by flag count (highest first)
   - Click protocol link to see context

3. **Take Action:**
   - **Approve**: Click green "Approve" button
     - Clears all flags
     - Makes review visible again
     - Use for false positives
   - **Delete**: Click red "Delete" button
     - Permanently removes review
     - Use for truly inappropriate content
     - Requires confirmation

### Admin Helper Functions

```typescript
// lib/admin.ts

// Check if current user is admin
await isAdmin(): Promise<boolean>

// Get current user ID
await getCurrentUserId(): Promise<string | null>
```

### Server Actions

```typescript
// app/actions/moderation-actions.ts

// Approve a review (reset flags)
await approveReview(reviewId: string)

// Delete a review permanently
await deleteReview(reviewId: string)
```

## Security Considerations

### Why This Approach?

1. **Database-Level Control**: Admin status is in `profiles` table
2. **Server-Side Checks**: All admin checks happen server-side
3. **Route Protection**: Page redirects non-admins
4. **Action Protection**: Server actions verify admin status
5. **Clerk Integration**: Uses Clerk's user IDs for identification

### Making Users Admin

**Option 1: SQL (Recommended)**
```sql
UPDATE profiles SET is_admin = true WHERE id = 'clerk-user-id';
```

**Option 2: Future Admin Panel**
- Build an admin management page
- Allow super-admins to grant/revoke admin status
- Track admin actions with audit logs

### Best Practices

1. **Limit Admin Accounts**: Only give admin to trusted users
2. **Audit Actions**: Log all approve/delete actions (future enhancement)
3. **Two-Factor Auth**: Require 2FA for admin accounts
4. **Regular Review**: Periodically audit who has admin access

## Moderation Workflow

### Typical Flow

```
User flags review (3 flags)
         ↓
Review auto-hidden (is_flagged = true)
         ↓
Admin reviews in dashboard
         ↓
    ┌───────┴───────┐
    ↓               ↓
Approve          Delete
(False positive) (Truly bad)
```

### When to Approve

- False positives (legitimate review flagged by mistake)
- Borderline content that doesn't violate rules
- Reviews flagged due to personal disagreement (not policy violation)

### When to Delete

- Hate speech, harassment, threats
- Spam or promotional content
- Personal attacks
- Explicit sexual content
- Dangerous medical advice

## Troubleshooting

### "Access Denied" or Redirected to Homepage

**Problem**: You're not marked as admin
**Solution**: 
1. Check your Clerk user ID
2. Run the SQL to grant admin role
3. Refresh the page

### Admin Link Not Showing in Navbar

**Problem**: Client hasn't fetched admin status yet
**Solution**:
1. Hard refresh (Cmd/Ctrl + Shift + R)
2. Check browser console for errors
3. Verify `/api/check-admin` endpoint works

### Reviews Not Updating After Action

**Problem**: Cache not revalidating
**Solution**:
1. Refresh the page manually
2. Check server logs for errors
3. Verify `revalidatePath` is working

## Future Enhancements

1. **Audit Logs**: Track who approved/deleted what
2. **Batch Actions**: Approve/delete multiple reviews at once
3. **Filter/Search**: Filter by protocol, author, date
4. **AI Context**: Show AI rejection reason if available
5. **Email Notifications**: Notify users of moderation decisions
6. **Appeal System**: Let users contest deletions
7. **Admin Roles**: Different permission levels (moderator vs super-admin)

## Testing

### Test Checklist

- [ ] Run SQL migration to add `is_admin` column
- [ ] Grant admin role to your user
- [ ] Access `/admin/moderation` (should load dashboard)
- [ ] Create a flagged review (flag it 3 times)
- [ ] Verify it appears in moderation queue
- [ ] Click "Approve" - verify flags reset
- [ ] Click "Delete" - verify review removed
- [ ] Test as non-admin (should redirect)
- [ ] Verify admin link shows/hides based on role

## Statistics

The dashboard shows:
- **Total Flagged**: Reviews with `flag_count > 0` OR `is_flagged = true`
- **Auto-Hidden**: Reviews with `is_flagged = true`
- **Pending Review**: Flagged but not yet auto-hidden

These update in real-time as you moderate content.


