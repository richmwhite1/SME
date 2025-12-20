# Railway Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

**Note:** `postgres.js` package is already installed.

### Step 2: Setup Environment Variables

Create `.env.local` file:

```bash
# Railway Postgres (get from Railway dashboard)
DATABASE_URL="postgresql://postgres:password@hostname.railway.app:port/railway"
NEXT_PUBLIC_DATABASE_URL="postgresql://postgres:password@hostname.railway.app:port/railway"

# Clerk (get from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY="sk-..."
```

### Step 3: Deploy to Railway

**Option A: Via Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway auto-detects Next.js and deploys

**Option B: Via Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project or create new
railway link

# Deploy
railway up
```

### Step 4: Add Postgres Database

In Railway Dashboard:
1. Click "New" > "Database" > "PostgreSQL"
2. Copy the `DATABASE_URL` from the Postgres service
3. Add to your service's environment variables

### Step 5: Run Database Migrations

```bash
# Connect to Railway Postgres
railway run psql $DATABASE_URL

# Or use the connection string directly
psql "postgresql://postgres:password@hostname.railway.app:port/railway"

# Run migrations (in this order)
\i supabase-rls-setup.sql
\i supabase-discussions-flagging.sql
\i supabase-global-search-universal-rpc.sql
\i supabase-flagging-autohide.sql
\i supabase-moderation-queue.sql
\i supabase-topic-follows.sql
# ... run all other SQL files
```

### Step 6: Configure Clerk Webhooks

1. Get your Railway app URL (e.g., `https://your-app.up.railway.app`)
2. Go to [Clerk Dashboard](https://dashboard.clerk.com)
3. Navigate to "Webhooks"
4. Click "Add Endpoint"
5. Set URL: `https://your-app.up.railway.app/api/webhooks/clerk`
6. Subscribe to: `user.created`, `user.updated`, `user.deleted`
7. Copy the signing secret (starts with `whsec_`)
8. Add to Railway environment variables as `CLERK_WEBHOOK_SECRET`

---

## ✅ Quick Test

After deployment, test these features:

1. **Sign In:** Visit `/sign-in` and authenticate
2. **Create Discussion:** Go to `/discussions/new`
3. **Search:** Use the search bar (⌘K)
4. **Comment:** Add a comment on any product
5. **Follow Topic:** Click follow on any topic tag
6. **Admin:** If admin, test flagging in `/admin`

---

## 🔧 Local Development

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

**Important:** Make sure your `.env.local` has valid `DATABASE_URL` pointing to Railway Postgres (or local Postgres for development).

---

## 📊 Database Schema

All tables should exist from the SQL migrations:

- `profiles` - User profiles
- `discussions` - Community discussions
- `discussion_comments` - Comments on discussions
- `product_comments` - Comments on products
- `topic_follows` - Topic subscriptions
- `follows` - User follows
- `moderation_queue` - Flagged content
- `keyword_blacklist` - Auto-flagging keywords
- `admin_logs` - Audit trail
- `protocols` - Products/protocols
- `resource_library` - Evidence library

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is correct
- Verify Railway Postgres is running
- Test connection: `psql $DATABASE_URL`

### "Clerk webhooks not working"
- Verify webhook URL is correct
- Check signing secret matches
- View webhook logs in Clerk dashboard

### "Global search returns nothing"
- Ensure `global_search()` function exists
- Run: `SELECT * FROM global_search('test', 10);`

### "Permission denied"
- Check RLS is disabled (or policies allow access)
- Run: `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;`

---

## 📚 Documentation

- **Full Migration Guide:** `RAILWAY-MIGRATION-COMPLETE.md`
- **Summary:** `MIGRATION-SUMMARY.md`
- **Railway Docs:** https://docs.railway.app
- **postgres.js Docs:** https://github.com/porsager/postgres

---

## 🎉 That's It!

Your application is now live on Railway with direct Postgres connections.

**Deploy Time:** ~5 minutes  
**Migration Status:** ✅ COMPLETE  
**Performance:** ⚡ Optimized

---

*Questions? Check the troubleshooting section or review the full migration guide.*
