# Profile Setup Guide

## Why "My Public Profile" Takes You to Settings

The "My Public Profile" link (`/u/me`) checks if you have a **username** set in your profile. If you don't have one, it redirects you to `/settings` to set it up.

## How to View Your Public Profile

### Step 1: Set Up Your Username
1. Go to http://localhost:3000/settings
2. Fill in the **Username** field (3-20 characters, letters, numbers, dashes, underscores)
3. Example: `richard-white`, `richardw`, `rwhite123`
4. Click "Save Changes"

### Step 2: View Your Public Profile
Once you have a username, you can view your public profile in two ways:

**Option A: Via UserButton Menu**
1. Click your profile icon in the navigation
2. Click "My Public Profile"
3. You'll see your public-facing profile with an "Edit Profile" button

**Option B: Direct URL**
- Go to http://localhost:3000/u/[your-username]
- Replace `[your-username]` with your actual username

## What You'll See

### As the Owner (You):
```
┌──────────────────────────────────────┐
│  Your Public Profile                 │
│  (Same view as public, but with      │
│   "Edit Profile" button)             │
├──────────────────────────────────────┤
│  Avatar                              │
│  Name                                │
│  @username                           │
│  Bio                                 │
│  Social Links (Discord, X, etc.)     │
│  Stats (Followers, Following, Score) │
│  [Edit Profile] Button ← Redirects   │
│                          to /settings │
└──────────────────────────────────────┘
```

### As a Public Viewer:
```
┌──────────────────────────────────────┐
│  Someone's Profile                   │
├──────────────────────────────────────┤
│  Avatar                              │
│  Name                                │
│  @username                           │
│  Bio                                 │
│  Social Links                        │
│  Stats                               │
│  [Follow] Button                     │
└──────────────────────────────────────┘
```

## Troubleshooting

### "My Public Profile" still goes to Settings
- **Cause**: Username not set in database
- **Fix**: Complete Step 1 above

### Profile shows but looks broken
- **Cause**: Missing data or styling issue
- **Fix**: Check browser console for errors

### Can't save username
- **Cause**: Username already taken or invalid format
- **Fix**: Try a different username (must be unique, 3-20 chars, alphanumeric + dashes/underscores)

## Key Points

1. **Username is Required**: You must set a username before you can view `/u/me`
2. **Public View Always**: The profile page always shows the public view, never an edit form
3. **Edit via Settings**: All editing happens at `/settings`, not on the profile page
4. **Owner Sees Edit Button**: You'll see an "Edit Profile" button that links to `/settings`
5. **Public Sees Follow Button**: Other users see a "Follow" button instead

## Testing the Flow

1. Go to `/settings` and set up your profile
2. Save changes
3. Click "My Public Profile" in UserButton menu
4. You should see your public profile with "Edit Profile" button
5. Click "Edit Profile" to go back to `/settings`


