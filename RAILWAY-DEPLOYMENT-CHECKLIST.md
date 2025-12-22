# 🚀 Railway Deployment Checklist

## Current Status
✅ Code pushed to GitHub (commit: `4755e34`)  
⏳ Railway deployment in progress  
⏳ Waiting for build to complete  

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All Supabase references removed
- [x] All database calls use `getDb()`
- [x] No `createClient` errors in source code
- [x] Package.json clean (no Supabase deps)

### ⏳ Railway Configuration

#### Environment Variables (Verify in Railway Dashboard)
- [ ] `DATABASE_URL` - Public Postgres connection string
- [ ] `DATABASE_PRIVATE_URL` - Internal Railway URL (optional, faster)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `OPENAI_API_KEY`

#### Build Settings
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Node version: 18.x or higher

## Post-Deployment Tasks

### 1. Database Schema Setup

#### Step 1: Run Main Schema
```bash
# Option A: Using Railway CLI
railway run psql $DATABASE_URL -f schema.sql

# Option B: Using direct connection
psql "postgresql://postgres:..." -f schema.sql
```

#### Step 2: Add Notifications Table
```bash
# Run the notifications table migration
psql $DATABASE_URL -f postgres-notifications-table.sql
```

#### Step 3: Verify Tables Exist
```sql
-- Connect to database and run:
\dt

-- Should see these tables:
-- profiles
-- protocols (products)
-- reviews
-- discussions
-- discussion_comments
-- discussion_votes
-- master_topics
-- topic_follows
-- follows
-- moderation_queue
-- keyword_blacklist
-- admin_logs
-- notifications
```

### 2. Seed Initial Data (Optional)

#### Option A: Use API Route
Visit: `https://sme-production.up.railway.app/api/production-seed`

#### Option B: Run SQL Directly
```bash
psql $DATABASE_URL -f postgres-seed-20-products.sql
```

### 3. Create Admin User

```sql
-- Set yourself as admin
UPDATE profiles 
SET is_admin = true, 
    is_verified_expert = true,
    badge_type = 'SME'
WHERE id = 'YOUR_CLERK_USER_ID';
```

### 4. Testing Checklist

#### Critical Pages
- [ ] Homepage: `https://sme-production.up.railway.app/`
  - Should load without errors
  - Products should display
  
- [ ] Discussions: `https://sme-production.up.railway.app/discussions`
  - Should load without `createClient` errors
  - Can create new discussion (if logged in)
  
- [ ] My Feed: `https://sme-production.up.railway.app/feed`
  - Topic picker should work
  - Feed should load after selecting topics
  
- [ ] Products: `https://sme-production.up.railway.app/products`
  - Products list should display
  - Product details should load
  
- [ ] Profile: `https://sme-production.up.railway.app/profile`
  - Profile should load
  - Edit profile should work

#### API Endpoints
- [ ] `/api/notifications` - Should return 200 (or empty array if no notifications)
- [ ] `/api/profile` - Should return user profile
- [ ] `/api/trending-topics` - Should return topics
- [ ] `/api/discussions` - Should return discussions

#### Authentication
- [ ] Sign in with Clerk works
- [ ] Sign up creates profile in database
- [ ] User session persists across pages

### 5. Browser Console Checks

#### Should Be Gone ✅
- ❌ `createClient is not defined`
- ❌ `@supabase/supabase-js` errors
- ❌ Database connection errors

#### Expected (Non-Critical)
- ⚠️ Clerk development key warning (only shows with dev keys)
- ⚠️ Deprecated `afterSignInUrl` prop (cosmetic, can fix later)

### 6. Performance Checks

- [ ] Page load time < 3 seconds
- [ ] API responses < 1 second
- [ ] No database timeout errors
- [ ] Images load properly

## Troubleshooting

### If deployment fails:
1. Check Railway build logs
2. Verify all environment variables are set
3. Check for TypeScript/ESLint errors
4. Ensure `package.json` scripts are correct

### If pages show 500 errors:
1. Check Railway deployment logs
2. Verify database schema is set up
3. Check that all required tables exist
4. Verify environment variables

### If `createClient` errors persist:
1. Hard refresh browser (Cmd+Shift+R)
2. Clear browser cache
3. Check that new deployment is actually live
4. Verify Railway deployment timestamp

### If database queries fail:
1. Verify `DATABASE_URL` is set correctly
2. Check that schema.sql ran successfully
3. Ensure notifications table was created
4. Test database connection manually

## Quick Commands

### Check Railway Deployment Status
```bash
railway status
```

### View Railway Logs
```bash
railway logs
```

### Connect to Database
```bash
railway run psql $DATABASE_URL
```

### Redeploy Manually
```bash
railway up
```

## Success Criteria

✅ All pages load without errors  
✅ No `createClient` errors in console  
✅ API routes return valid data  
✅ Users can sign in/sign up  
✅ Database queries work  
✅ Notifications load  
✅ Discussions can be created/viewed  
✅ Products display correctly  

---

**Next Action**: Wait for Railway deployment to complete, then run database schema setup.

**Estimated Time**: 
- Deployment: 3-5 minutes
- Database setup: 2-3 minutes
- Testing: 5-10 minutes
- **Total: ~15 minutes**
