# Testing Checklist - Discussion Board & Feed Upgrade

## Database Setup (REQUIRED FIRST)

### Step 1: Create Global Feed View
Run this SQL in Supabase SQL Editor:
```bash
# Use the file: supabase-global-feed-view.sql
```

The view combines reviews and discussions into a unified global feed.

## Testing Steps

### 1. Discussion Board

#### Test: View Discussions List
- [ ] Navigate to `http://localhost:3000/discussions`
- [ ] Should see "Discussions" page with list of discussions (or empty state)
- [ ] If logged in: "Start Discussion" button visible
- [ ] If not logged in: No "Start Discussion" button

#### Test: Create Discussion (Logged In)
- [ ] Click "Start Discussion" button
- [ ] Navigate to `/discussions/new`
- [ ] Fill in title (min 5 chars)
- [ ] Fill in content (min 20 chars)
- [ ] Add tags (optional, max 5)
- [ ] Click "Post Discussion"
- [ ] Should see "Creating..." loading state
- [ ] AI moderation runs automatically
- [ ] Redirects to `/discussions` on success
- [ ] New discussion appears in list

#### Test: AI Moderation (Vibe Check)
- [ ] Try posting discussion with inappropriate content
- [ ] Should see error: "Content not allowed: [reason]"
- [ ] Alert should appear with the error message
- [ ] Discussion should NOT be created

#### Test: Discussion Card Display
- [ ] Each discussion shows:
  - [ ] Title (large, bold)
  - [ ] Content preview (2 lines max)
  - [ ] Tags (if any) with green badges
  - [ ] Author name and avatar
  - [ ] Timestamp (relative, e.g., "2 hours ago")
- [ ] Clicking card should navigate to discussion detail (when implemented)

### 2. Feed Page Upgrade

#### Test: Feed Tabs
- [ ] Navigate to `http://localhost:3000/feed`
- [ ] Should see two tabs: "My Tribe" and "Community Pulse"
- [ ] If following users: "My Tribe" tab active by default
- [ ] If not following anyone: "Community Pulse" tab active by default

#### Test: My Tribe Tab
- [ ] Click "My Tribe" tab
- [ ] If following users:
  - [ ] Shows activity from followed users only
  - [ ] Activity sorted by date (newest first)
  - [ ] Empty state: "Your tribe hasn't posted anything yet"
- [ ] If not following anyone:
  - [ ] Shows "Follow these top contributors" message
  - [ ] Shows recommended contributors (top 10 by contributor score)
  - [ ] Each contributor card shows: avatar, name, username, score, "View Profile" button

#### Test: Community Pulse Tab
- [ ] Click "Community Pulse" tab
- [ ] Shows global activity (last 20 items)
- [ ] Combines reviews AND discussions
- [ ] Sorted by date (newest first)
- [ ] Empty state: "No community activity yet"

#### Test: Activity Card Differences

**Discussion Card:**
- [ ] Green badge with MessageSquare icon: "Discussion"
- [ ] Shows discussion title (large)
- [ ] Shows content
- [ ] Shows tags (green badges with Tag icon)
- [ ] Author info (avatar, name, timestamp)

**Review Card:**
- [ ] Gray badge with Star icon: "Review"
- [ ] Shows protocol link (BookOpen icon + protocol title)
- [ ] Shows review content
- [ ] NO tags
- [ ] Author info (avatar, name, timestamp)

### 3. Share Profile Button

#### Test: Share Button Display
- [ ] Navigate to any profile: `http://localhost:3000/u/[username]`
- [ ] Look for "Share" button next to user's name
- [ ] Button should have Share2 icon

#### Test: Share Button Functionality
- [ ] Click "Share" button
- [ ] Profile URL should be copied to clipboard
- [ ] Button text changes to "Copied!" with Check icon
- [ ] Green text color for confirmation
- [ ] After 2 seconds, reverts to "Share" with Share2 icon
- [ ] Test by pasting clipboard content - should be profile URL

#### Test: Share Button Fallback
- [ ] If clipboard API fails (rare):
  - [ ] Alert should appear with profile URL
  - [ ] User can manually copy from alert

## Browser Testing

### Test in Chrome/Edge
- [ ] All features work
- [ ] Clipboard API works
- [ ] No console errors

### Test in Firefox
- [ ] All features work
- [ ] Clipboard API works
- [ ] No console errors

### Test in Safari
- [ ] All features work
- [ ] Clipboard API works (may require user interaction)
- [ ] No console errors

## Mobile Testing

### Test on Mobile Device
- [ ] Discussion list displays correctly
- [ ] Feed tabs are touch-friendly
- [ ] Share button works on mobile
- [ ] Cards are responsive
- [ ] No layout issues

## Edge Cases

### Discussion Creation
- [ ] Title too short (< 5 chars): Shows error
- [ ] Content too short (< 20 chars): Shows error
- [ ] More than 5 tags: "Add Tag" button disabled
- [ ] Empty tag input: "Add Tag" button disabled
- [ ] Duplicate tags: Not added
- [ ] Not logged in: Redirects to home

### Feed
- [ ] No following, no global activity: Both tabs show empty states
- [ ] Following users but no activity: "My Tribe" shows empty state
- [ ] Global feed with exactly 20 items: All displayed
- [ ] Global feed with more than 20 items: Only 20 displayed

### Share Profile
- [ ] Profile without username: Share button still works (uses current URL)
- [ ] Long username: URL still copies correctly
- [ ] Rapid clicking: Doesn't break, timer resets

## Performance

- [ ] Discussion list loads quickly (< 1s)
- [ ] Feed tabs switch instantly (client-side)
- [ ] Global feed limited to 20 items (performance)
- [ ] No lag when adding/removing tags
- [ ] Share button responds immediately

## Accessibility

- [ ] All buttons have proper labels
- [ ] Tab navigation works
- [ ] Screen reader friendly
- [ ] Keyboard shortcuts work (Enter to submit forms)
- [ ] Focus states visible

## Console Checks

### No Errors
- [ ] No React errors
- [ ] No TypeScript errors
- [ ] No Supabase errors
- [ ] No 404s for missing resources

### Expected Logs
- [ ] "Running vibe check on discussion content..."
- [ ] "Discussion passed vibe check" (on success)
- [ ] "Discussion blocked by AI moderation: [reason]" (on failure)

## Final Verification

- [ ] All new pages render correctly
- [ ] All new components render correctly
- [ ] Database view created successfully
- [ ] No breaking changes to existing features
- [ ] Code is clean and follows project patterns
- [ ] Documentation is complete (DISCUSSIONS-SETUP.md)

## Known Limitations

1. **Discussion Detail Page**: Not yet implemented (clicking discussion card doesn't navigate)
2. **Discussion Comments**: Not yet implemented
3. **Discussion Editing**: Not yet implemented
4. **Discussion Deletion**: Not yet implemented
5. **Tag Filtering**: Not yet implemented (discussions can't be filtered by tag)
6. **Search**: Not yet implemented (can't search discussions)

## Next Steps (Future Enhancements)

1. Create discussion detail page (`/discussions/[slug]`)
2. Add comments system for discussions
3. Add edit/delete for discussion authors
4. Add tag filtering on discussions page
5. Add search functionality
6. Add discussion upvoting/liking
7. Add notification system for discussion replies
8. Add discussion bookmarking


