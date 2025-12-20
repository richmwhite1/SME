# Clerk Sign-In/Passkey Fix - Diagnostic Checklist

## ✅ Completed Fixes

### 1. Environment Variables
- ✅ Verified `.env.local` contains:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET`

### 2. Middleware Fix
- ✅ Updated `middleware.ts` to explicitly allow Clerk's internal routes:
  - `/api/auth(.*)` - Clerk authentication callbacks
  - `/sign-in(.*)` - Sign-in routes
  - `/sign-up(.*)` - Sign-up routes
  - `/sso-callback(.*)` - SSO callbacks

### 3. ClerkProvider Configuration
- ✅ Added explicit configuration in `app/layout.tsx`:
  - `signInUrl="/"` - Redirects to home for sign-in
  - `signUpUrl="/"` - Redirects to home for sign-up
  - `afterSignInUrl="/"` - Redirects to home after sign-in
  - `afterSignUpUrl="/"` - Redirects to home after sign-up

## 🔧 Required Actions in Clerk Dashboard

### Step 1: Verify Origin Configuration
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Settings** → **Domains**
4. Ensure `http://localhost:3000` is listed under **Allowed Origins**
5. If not, click **Add Domain** and add `http://localhost:3000`

### Step 2: Configure Authentication Methods (IMPORTANT)
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Ensure **Email** authentication is enabled
3. Go to **User & Authentication** → **Passkeys**
4. **IMPORTANT**: Check the **"Require passkeys"** setting
   - If enabled, **DISABLE IT** for development
   - Passkeys should be **optional**, not required
5. Ensure **Email/Password** is available as a primary authentication method

### Step 3: Verify Sign-In/Sign-Up Options
1. Go to **User & Authentication** → **Sign-in/Sign-up**
2. Check that multiple authentication methods are enabled:
   - ✅ Email + Password
   - ✅ Passkey (optional, not required)
3. Ensure no single method is forced

### Step 4: Check Redirect URLs
1. Go to **Settings** → **Paths**
2. Verify:
   - **Sign-in URL**: Should match your app's sign-in flow (or use Clerk's default)
   - **Sign-up URL**: Should match your app's sign-up flow (or use Clerk's default)
   - **After sign-in URL**: `/` (home page)
   - **After sign-up URL**: `/` (home page)

## 🧪 Testing Steps

1. **Clear Browser Cache**
   ```bash
   # Or use browser's incognito/private mode
   ```

2. **Restart Development Server**
   ```bash
   npm run dev
   ```

3. **Test Sign-In Flow**
   - Click "Sign In" button
   - Should see Clerk's modal with multiple authentication options
   - Email/Password should be visible and functional
   - Passkey should be optional, not required

4. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab for any Clerk-related errors
   - Check Network tab for failed API calls to Clerk

## 🔍 Troubleshooting

### If Sign-In Modal Doesn't Appear
- Check browser console for errors
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correctly set
- Ensure middleware isn't blocking the route (should be fixed now)

### If Only Passkeys Are Shown
- Go to Clerk Dashboard → **User & Authentication** → **Passkeys**
- Disable "Require passkeys" option
- Ensure Email authentication is enabled

### If Callback Errors Occur
- Verify `http://localhost:3000` is in Clerk's allowed origins
- Check that middleware allows `/api/auth/*` routes (should be fixed now)
- Ensure `CLERK_SECRET_KEY` matches your Clerk dashboard

### If Environment Variables Aren't Loading
1. Ensure `.env.local` is in the project root
2. Restart the dev server after changing `.env.local`
3. Verify keys are correct (no extra spaces, quotes, etc.)

## 📝 Environment Variables Reference

Your `.env.local` should contain:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhooks (if using)
CLERK_WEBHOOK_SECRET=whsec_...
```

**Note**: Never commit `.env.local` to version control!

## 🚀 Next Steps

After completing the Clerk Dashboard checks:
1. Test sign-in with email/password
2. Verify passkeys work as optional method
3. Confirm redirects work correctly after authentication
4. Test sign-out functionality

If issues persist after these fixes, check Clerk's [troubleshooting guide](https://clerk.com/docs/troubleshooting/overview) or contact Clerk support.

