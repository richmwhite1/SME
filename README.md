# Holistic Community Protocol

A high-vibe, calm-tech community platform for holistic health built with Next.js 14, Clerk, and Supabase.

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see below)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔑 Environment Variables Setup

Create a `.env.local` file in the project root and add the following environment variables:

### Clerk Authentication Keys

**Where to get them:**
1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign in or create a new account
3. Create a new application (or select an existing one)
4. In your application dashboard, navigate to **API Keys** in the left sidebar
5. You'll see two keys:
   - **Publishable Key** → Copy this value to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → Click "Show" and copy this value to `CLERK_SECRET_KEY`

**Note:** Clerk will automatically generate keys when you create a new application, so you don't need to manually create them.

### Supabase Database Keys

**Where to get them:**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in or create a new account
3. Create a new project (or select an existing one)
   - Choose an organization
   - Enter a project name
   - Set a database password (save this securely)
   - Select a region
   - Wait for the project to finish provisioning (takes ~2 minutes)
4. Once your project is ready, go to **Project Settings** (gear icon in the left sidebar)
5. Click on **API** in the settings menu
6. Under **Project API keys**, you'll find:
   - **Project URL** → Copy this value to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Copy this value to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - This is the key labeled as "anon" or "public" (not the "service_role" key, which is secret)

**Important:** 
- Use the **anon/public** key, not the service_role key
- The service_role key has admin privileges and should never be exposed in client-side code
- If you see "Publishable Key" in newer Supabase docs, that's the same as the anon/public key

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with ClerkProvider
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (Navbar, etc.)
│   └── holistic/          # Feature-specific components
├── lib/
│   ├── supabase/          # Supabase client helpers
│   └── utils.ts           # Utility functions
└── middleware.ts          # Clerk middleware
```

## 🎨 Design System

- **Colors:** Earth tones (Moss Green, Sand, Slate, Soft Clay)
- **Philosophy:** Calm Tech - breathable, uncluttered, earthy
- **Interactions:** Smooth micro-animations with scale transforms

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React

## 📝 Notes

- This project uses Clerk for authentication and Supabase purely as a data store
- All pages are Server Components by default (only add `'use client'` when needed)
- The middleware handles Clerk authentication automatically

