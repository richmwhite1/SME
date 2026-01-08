# 🚀 Local Development Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local` in the project root with the following:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase Service Role (Optional - needed for image uploads)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Google AI API Key (Required for AI Features)
GOOGLE_AI_API_KEY=AIza...
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Browser
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📋 Where to Get Environment Variables

### Clerk Keys
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application (or create a new one)
3. Go to **API Keys** in the sidebar
4. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### Supabase Keys
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Google AI Key
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy to `GOOGLE_AI_API_KEY`

---

## 🗄️ Database Setup

After setting up Supabase, you'll need to run SQL migrations. Check these files:

- `supabase-business-intake-pipeline.sql` - Business intake tables
- `supabase-discussion-flags-table.sql` - Discussion flagging system
- `supabase-moderation-queue.sql` - Moderation queue
- `supabase-trust-safety-layer.sql` - Trust & safety features

Run these in the Supabase SQL Editor in order.

---

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] Clerk keys configured
- [ ] Supabase keys configured
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] App loads at http://localhost:3000
- [ ] Can sign in/up with Clerk
- [ ] Database queries work (check browser console)

---

## 🐛 Common Issues

### "Missing Supabase environment variables"
→ Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

### "Missing Clerk environment variables"
→ Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set

### Port 3000 already in use
→ Kill the process: `lsof -ti:3000 | xargs kill -9` or use a different port: `npm run dev -- -p 3001`

### Database errors
→ Make sure you've run the required SQL migrations in Supabase

---

## 📚 Next Steps

1. **Test Authentication**: Sign up/login with Clerk
2. **Test Database**: Create a discussion or product
3. **Test Admin**: Access `/admin` (if you're set as admin)
4. **Check Console**: Look for any errors in browser console

---

**Ready to code!** 🎉

