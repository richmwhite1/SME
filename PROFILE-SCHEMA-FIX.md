# Profile Schema Fix - Social Media & Read-Only Views

## Critical Fixes Applied

### 1. Schema Mismatch Fixed ✅

**Problem**: The `updateProfile` action was trying to write to `instagram_handle` column, which doesn't exist in the database schema.

**Solution**: All social media links now save to the `social_links` JSONB column:

```typescript
// Before (BROKEN):
updateProfile(fullName, username, bio, credentials, websiteUrl, instagramHandle, socialLinks)
// Tried to save instagramHandle to non-existent column

// After (FIXED):
updateProfile(fullName, username, bio, credentials, websiteUrl, socialLinks)
// All social media (discord, telegram, x, instagram) saved to social_links JSONB
```

**Database Schema**:
```sql
profiles:
  - full_name (text)
  - username (text, unique)
  - bio (text)
  - credentials (text)
  - website_url (text)
  - social_links (jsonb) ← All social media stored here
    {
      "discord": "username#1234",
      "telegram": "@handle",
      "x": "@handle",
      "instagram": "@handle"
    }
```

### 2. Public Profile - Strict Read-Only ✅

**Rule**: `app/u/[username]/page.tsx` is **ALWAYS** read-only.

**Implementation**:
- ✅ No forms, inputs, textareas, or selects
- ✅ Displays Bio, Name, Contributor Score as **text only**
- ✅ Social links displayed as **clickable icons** (read-only)
- ✅ Owner sees "Edit Profile" button → redirects to `/settings`
- ✅ Public viewers see "Follow" button
- ✅ Guests see "Sign in to Follow"

**Owner View Logic**:
```typescript
const isOwner = clerkUser?.id === typedProfile.id;

{isOwner ? (
  // Owner: Edit button redirects to /settings
  <Link href="/settings">
    <Button variant="primary">
      <Edit size={16} /> Edit Profile
    </Button>
  </Link>
) : (
  // Public: Follow button
  <ProfileFollowButton targetUserId={profile.id} isFollowing={isFollowing} />
)}
```

### 3. Settings Page - Edit Form ✅

**Rule**: All editing happens in `/settings`.

**Implementation**:
- ✅ Form inputs for all profile fields
- ✅ Social media section with 4 inputs (Discord, Telegram, X, Instagram)
- ✅ All social media saves to `social_links` JSONB
- ✅ Reads from `social_links` on page load

**Form State**:
```typescript
// Reads from social_links JSONB
const [discord, setDiscord] = useState(initialProfile.social_links?.discord || "");
const [telegram, setTelegram] = useState(initialProfile.social_links?.telegram || "");
const [x, setX] = useState(initialProfile.social_links?.x || "");
const [instagram, setInstagram] = useState(initialProfile.social_links?.instagram || "");

// Saves to social_links JSONB
await updateProfile(fullName, username, bio, credentials, websiteUrl, {
  discord: discord || undefined,
  telegram: telegram || undefined,
  x: x || undefined,
  instagram: instagram || undefined,
});
```

## Files Modified

1. **`app/actions/profile-actions.ts`**
   - Removed `instagramHandle` parameter
   - All social media now in `socialLinks` object
   - Saves to `social_links` JSONB column

2. **`components/profile/ProfileSettingsForm.tsx`**
   - Removed `instagramHandle` state
   - Added `instagram` state (reads from `social_links.instagram`)
   - All social inputs save to `social_links` JSONB

3. **`app/settings/page.tsx`**
   - Removed `instagram_handle` from profile fetch
   - Fetches `social_links` JSONB

4. **`app/u/[username]/page.tsx`**
   - Removed `instagram_handle` from profile interface
   - Removed `instagram_handle` from profile fetch
   - Displays social links from `social_links` JSONB as icons
   - **Confirmed**: No forms, inputs, or editable fields (100% read-only)

## Testing Checklist

### Settings Page (`/settings`)
- [ ] Can edit full name, username, bio, credentials, website
- [ ] Can edit Discord, Telegram, X, Instagram
- [ ] Save button works
- [ ] All social media saves to `social_links` JSONB
- [ ] On reload, all social media fields populate correctly

### Public Profile (`/u/[username]`)
- [ ] Owner sees "Edit Profile" button (not Follow button)
- [ ] Public viewers see "Follow" button (not Edit button)
- [ ] Guests see "Sign in to Follow"
- [ ] Social media icons display correctly
- [ ] Clicking social icons opens correct links
- [ ] **NO** input fields or forms visible
- [ ] Bio, Name, Score display as text only

### Navigation
- [ ] "My Public Profile" in UserButton → `/u/me` → `/u/[username]`
- [ ] "Edit Profile" button → `/settings`
- [ ] Settings page has all form inputs

## SQL to Run (If Not Already Run)

```sql
-- Add social_links JSONB column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING GIN (social_links);
```

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Profile System                        │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   /u/[username]      │          │      /settings       │
│  (Public Profile)    │          │   (Edit Profile)     │
├──────────────────────┤          ├──────────────────────┤
│ ✅ READ-ONLY VIEW    │          │ ✅ EDIT FORM         │
│ • Text display       │          │ • Input fields       │
│ • Social icons       │          │ • Social inputs      │
│ • Edit button (owner)│◄─────────┤ • Save button        │
│ • Follow (public)    │          │                      │
└──────────────────────┘          └──────────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase profiles Table                     │
├─────────────────────────────────────────────────────────┤
│ • full_name, username, bio, credentials, website_url    │
│ • social_links (JSONB):                                 │
│   { discord, telegram, x, instagram }                   │
└─────────────────────────────────────────────────────────┘
```

## Key Takeaways

1. **Single Source of Truth**: All social media → `social_links` JSONB
2. **Strict Separation**: Public profile = read-only, Settings = edit form
3. **Owner Experience**: Owner sees public view + "Edit Profile" button
4. **No Legacy Columns**: `instagram_handle` column removed from all queries
5. **Type Safety**: Using `@ts-expect-error` for Supabase type mismatches


