# 🚨 URGENT: Create Cloudinary Upload Preset

## The Problem

You're getting a **400 Bad Request** error because the upload preset `sme_products` either:
1. Doesn't exist in your Cloudinary account, OR
2. Exists but isn't set to "Unsigned" mode

## The Solution (2 minutes)

### Step 1: Go to Cloudinary Upload Settings

Open this URL in your browser:
**https://console.cloudinary.com/settings/c-dbpfswbkm/upload**

(This is your specific Cloudinary account settings page)

### Step 2: Find Upload Presets Section

Scroll down to the **"Upload presets"** section

### Step 3: Check if `sme_products` Exists

Look for a preset named `sme_products` in the list.

**If it EXISTS:**
1. Click the **Edit** button (pencil icon) next to it
2. Check the **"Signing Mode"** dropdown
3. If it says "Signed", change it to **"Unsigned"**
4. Click **Save**
5. Skip to Step 5 below

**If it DOESN'T EXIST:**
Continue to Step 4

### Step 4: Create the Upload Preset

1. Click **"Add upload preset"** button (top right)
2. Fill in the form:

```
Preset name: sme_products
Signing Mode: Unsigned ⚠️ CRITICAL - Must be "Unsigned"!
Folder: products (optional but recommended)
```

3. Leave all other settings as default
4. Click **Save**

### Step 5: Verify It's Unsigned

After creating/editing, you should see in the list:
```
sme_products | Unsigned | ...
```

The word **"Unsigned"** must appear next to the preset name!

### Step 6: Test Upload

1. Go back to http://localhost:3000/products/submit
2. Fill Step 1
3. In Step 2, click **"Upload Photo"**
4. Widget should now work!

## Why "Unsigned" is Required

- **Unsigned** = Browser can upload directly to Cloudinary (what we need)
- **Signed** = Requires server-side signature (more complex, not needed here)

Our widget is configured for unsigned uploads, so the preset MUST be unsigned.

## Still Getting 400 Error?

If you still get 400 after creating the unsigned preset:

1. **Hard refresh** the browser (Cmd+Shift+R or Ctrl+Shift+R)
2. **Clear browser cache**
3. **Restart dev server** (Ctrl+C, then `npm run dev`)
4. Try again

## Verify Your Setup

Your `.env.local` should have:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dbpfswbkm ✅
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=sme_products ✅
```

Your Cloudinary preset should show:
```
sme_products | Unsigned ✅
```

## Screenshot Guide

When you're on the Upload Presets page, you should see something like:

```
┌─────────────────────────────────────────┐
│ Upload presets                          │
│ ┌─────────────────────────────────────┐ │
│ │ Add upload preset                   │ │ ← Click this if preset doesn't exist
│ └─────────────────────────────────────┘ │
│                                         │
│ Preset name    | Mode      | Folder    │
│ ─────────────────────────────────────── │
│ sme_products   | Unsigned  | products  │ ← Should look like this
│                                         │
└─────────────────────────────────────────┘
```

---

**Once you create the unsigned preset, the upload will work immediately!**
