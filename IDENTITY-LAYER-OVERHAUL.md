# Identity Layer Overhaul

## Summary

Overhauled the Identity Layer to ensure SMEs are visible, social links drive traffic, and profile management is streamlined through Clerk.

---

## 1. Header (Navbar.tsx) ✅

### Changes Made

**File**: `components/layout/Navbar.tsx`

- ✅ **Removed Static Social Icons**: Removed `<SocialLinks variant="header" />` from both desktop and mobile navigation
- ✅ **Clerk UserButton**: Already using Clerk's `<UserButton />` via `SMEUserButton` component
- ✅ **SignedIn Wrapper**: UserButton is wrapped in `<SignedIn>` component
- ✅ **SignInButton Fallback**: Added `<SignedOut><SignInButton /></SignedOut>` for logged-out users
- ✅ **Admin Badge Visibility**: Fixed admin badge text color to `text-white/40` for better visibility on dark backgrounds

**File**: `components/layout/SMEUserButton.tsx`

- ✅ **Admin Badge**: Changed from `text-emerald-400/80` to `text-white/40` for better readability
- ✅ **UserButton Configuration**: Added appearance customization for dark theme
- ✅ **Manage Account**: Clerk's UserButton automatically includes "Manage Account" option that opens UserProfile modal

### Admin Badge Display

```tsx
{!loading && isAdmin && (
  <span className="border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white/40">
    LAB ADMIN
  </span>
)}
```

**Before**: `text-emerald-400/80` (too dark, hard to see)
**After**: `text-white/40` (readable on dark backgrounds)

---

## 2. Social Media Editing ✅

### Changes Made

**File**: `app/actions/profile-actions.ts`

- ✅ **Clerk publicMetadata**: X Handle and Telegram are now saved to Clerk's `publicMetadata`
- ✅ **Dual Storage**: Also saved to database `social_links` for backward compatibility
- ✅ **Clerk Precedence**: When reading, Clerk `publicMetadata` takes precedence over database

**File**: `app/settings/page.tsx`

- ✅ **Read from Clerk**: Settings page reads X and Telegram from Clerk `publicMetadata`
- ✅ **Fallback to Database**: Falls back to database `social_links` if Clerk metadata not available
- ✅ **Merge Logic**: Merges Clerk metadata with database values (Clerk takes precedence)

**File**: `components/profile/ProfileSettingsForm.tsx`

- ✅ **X and Telegram Fields**: Already present in the form
- ✅ **Labels**: "X (Twitter) Handle" and "Telegram Username"
- ✅ **Placeholders**: "@username" format

### Data Strategy

**Storage**:
1. **Primary**: Clerk `publicMetadata` (site-wide persistence)
   ```typescript
   publicMetadata: {
     xHandle: socialLinks.x || null,
     telegramHandle: socialLinks.telegram || null,
   }
   ```

2. **Secondary**: Database `social_links` JSONB (backward compatibility)
   ```typescript
   social_links: {
     x: socialLinks.x,
     telegram: socialLinks.telegram,
     // ... other social links
   }
   ```

**Reading**:
- Clerk `publicMetadata` is checked first
- Falls back to database `social_links` if not in Clerk
- Merged for display (Clerk values take precedence)

### Profile Picture

- ✅ **Clerk UserProfile**: Using Clerk's built-in `<UserButton />` which includes "Manage Account"
- ✅ **UserProfile Modal**: Clicking "Manage Account" opens Clerk's UserProfile modal
- ✅ **No Custom Upload**: Following best practice - using Clerk's native image handling
- ✅ **Safe Storage**: Avoids storage errors by using Clerk's managed storage

---

## 3. Clickable SME Profiles ✅

### Status: Already Implemented

**File**: `components/discussions/DiscussionComments.tsx`

- ✅ **Clickable Names**: Author names wrapped in `<Link>` to profile page
- ✅ **Clickable Avatars**: Avatars wrapped in `<Link>` via `AvatarLink` component
- ✅ **Profile Routes**: Uses `/u/${username}` when available, falls back to `/profile/${id}`
- ✅ **Guest Comments**: Guest pill styled as secondary (not primary SME)

### Profile Linking

```tsx
<Link
  href={comment.profiles.username 
    ? `/u/${comment.profiles.username}` 
    : `/profile/${comment.profiles.id || ""}`}
  onClick={(e) => e.stopPropagation()}
  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
>
  <AvatarLink ... />
  <span className="text-xs font-semibold text-bone-white font-mono hover:text-heart-green transition-colors">
    {comment.profiles.full_name || "Anonymous"}
  </span>
</Link>
```

**File**: `app/u/[username]/page.tsx`

- ✅ **X Handle Link**: Clickable button that opens `https://x.com/${handle}` in new tab
- ✅ **Telegram Link**: Clickable button that opens `https://t.me/${handle}` in new tab
- ✅ **External Links**: Both use `target="_blank" rel="noopener noreferrer"`
- ✅ **Discussion Stays On Site**: Social links are for discovery, all discussion happens on platform

---

## 4. Navigation Logic ✅

### UserButton Configuration

**File**: `components/layout/SMEUserButton.tsx`

- ✅ **Manage Account**: Clerk's UserButton automatically includes "Manage Account" option
- ✅ **UserProfile Modal**: Clicking "Manage Account" opens Clerk's UserProfile modal
- ✅ **Profile Management**: Users can change name and image through Clerk's native interface
- ✅ **No Custom Implementation**: Using Clerk's built-in functionality (safest approach)

### UserButton Menu Items

The UserButton includes:
- **Manage Account** (built-in, opens UserProfile modal)
- My Profile (custom link to `/u/me`)
- My Feed (custom link to `/feed`)
- Audit Dashboard (if SME)
- Admin Dashboard (if admin)
- Moderation Queue (if admin)

---

## Files Modified

1. **`components/layout/Navbar.tsx`**
   - Removed static SocialLinks component
   - Verified SignedIn/SignedOut wrappers

2. **`components/layout/SMEUserButton.tsx`**
   - Fixed admin badge visibility (`text-white/40`)
   - Added appearance customization

3. **`app/actions/profile-actions.ts`**
   - Added Clerk `clerkClient` import
   - Save X and Telegram to Clerk `publicMetadata`
   - Maintain backward compatibility with database

4. **`app/settings/page.tsx`**
   - Read X and Telegram from Clerk `publicMetadata`
   - Merge with database values (Clerk precedence)

5. **`app/u/[username]/page.tsx`**
   - Read X and Telegram from Clerk `publicMetadata` for own profile
   - Merge with database values for display

---

## Testing Checklist

### Header
- [ ] Static Twitter/Telegram icons removed from header
- [ ] UserButton appears for signed-in users
- [ ] Sign In button appears for signed-out users
- [ ] Admin badge is visible (text-white/40)
- [ ] Admin badge appears next to UserButton

### Social Media Editing
- [ ] X Handle field present in profile settings
- [ ] Telegram Username field present in profile settings
- [ ] Values save to Clerk publicMetadata
- [ ] Values also save to database (backward compatibility)
- [ ] Values read from Clerk publicMetadata (takes precedence)
- [ ] Falls back to database if Clerk metadata not available

### Profile Picture
- [ ] UserButton includes "Manage Account" option
- [ ] Clicking "Manage Account" opens Clerk UserProfile modal
- [ ] Can change name through Clerk modal
- [ ] Can change image through Clerk modal
- [ ] No custom upload implementation (using Clerk's native)

### Clickable Profiles
- [ ] Comment author names are clickable
- [ ] Comment avatars are clickable
- [ ] Links go to correct profile page
- [ ] Guest comments show secondary-styled pill
- [ ] X Handle link works on profile page
- [ ] Telegram link works on profile page
- [ ] Links open in new tab

### Navigation
- [ ] UserButton menu includes "Manage Account"
- [ ] "Manage Account" opens Clerk UserProfile modal
- [ ] Can manage account settings through Clerk

---

## Data Flow

### Saving Social Links

```
User Input (Settings Form)
    ↓
updateProfile() Server Action
    ↓
    ├─→ Clerk publicMetadata (xHandle, telegramHandle)
    └─→ Database social_links JSONB
```

### Reading Social Links

```
Profile Page Request
    ↓
    ├─→ Check Clerk publicMetadata (if own profile)
    ├─→ Check Database social_links
    └─→ Merge (Clerk takes precedence)
```

---

## Benefits

1. **Site-Wide Persistence**: Clerk `publicMetadata` persists across all sessions
2. **No Database Migration**: Can use Clerk metadata without complex migrations
3. **Backward Compatibility**: Still saves to database for existing functionality
4. **Native Profile Management**: Uses Clerk's built-in UserProfile modal
5. **Safe Image Handling**: No custom upload = no storage errors
6. **Better Visibility**: Admin badge now readable on dark backgrounds

---

## Future Enhancements

- [ ] Migrate all social links to Clerk publicMetadata
- [ ] Add social link validation
- [ ] Add social link preview cards
- [ ] Add social link analytics
- [ ] Consider migrating other profile fields to Clerk metadata


