---
description: Technology stack and domain rules for the SME Reputation System workspace.
globs: "**/*.{ts,tsx,md,json}"
---

# Tech Stack & Workspace Rules

## 1. Frontend Framework
- **React 18+ & Next.js 14+ (App Router)**
  - Use **Server Components** by default. Use `"use client"` only for interactive components.
  - Use `lucide-react` for icons.

## 2. Database & Backend
- **Railway Postgres**
  - Use **raw SQL** via `postgres.js` (aliased as `sql` in `lib/db.ts`) for all data operations.
  - **NO ORMs** (Prisma, Drizzle, etc.). Write optimizing SQL queries directly.
  - All database mutations must happen in **Server Actions**.

## 3. Media Management
- **Cloudinary**
  - Use `next-cloudinary` for optimizing images.
  - Use the `CldUploadWidget` for client-side uploads.
  - Store `public_id` and `secure_url` in Postgres.

## 4. SME Reputation System (Domain Logic)
- **Lenses (Reputation Categories)**:
  - `Scientific`: Empirical evidence, peer-reviewed data.
  - `Alternative`: Holistic, traditional, or experimental approaches.
  - `Esoteric`: Spiritual, intuitive, or metaphysical frameworks.
- **Verification**:
  - `needs_sme_review`: Flag for content requiring expert validation.
  - `reputation_tier`:
    - `1`: Novice / Unverified
    - `2`: Verified Contributor
    - `3`: Domain Expert (Subject Matter Expert)
- **Content Hierarchy**:
  - `Product`: The core entity being discussed.
  - `Topic`: Tags/Categories that products and discussions belong to.
  - `Discussion`: User-generated threads about products/topics.
  - `Vouch`: A signal of trust from a user to a product/sme.

## 5. Deployment
- **Railway**
  - Production branch: `main`
  - Environment variables must be synced with Railway dashboard.
  - Build command: `npm run build`
  - Start command: `npm start`
