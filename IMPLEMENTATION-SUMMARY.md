# Hybrid Vibe Check & Flagging System - Implementation Summary

## ✅ What's Been Built

### 1. AI Moderation (Vibe Check)
- ✅ `lib/vibe-check.ts` - Returns `{ isSafe: boolean, reason: string }`
- ✅ Uses OpenAI GPT-4o-mini with JSON response format
- ✅ Hybrid logic: Guest users checked, authenticated users bypass
- ✅ Graceful error handling with logging

### 2. Updated Review Submission
- ✅ `submitReview()` checks authentication status
- ✅ Guests get AI check, shows rejection reason if unsafe
- ✅ Authenticated users bypass AI entirely

### 3. Flagging System with Auto-Hide
- ✅ `flagReview()` server action created
- ✅ Increments `flag_count` on reviews
- ✅ Auto-hides at 3 flags (`is_flagged = true`)
- ✅ Uses atomic SQL function for race-condition safety

### 4. UI Updates
- ✅ Flag button added to every review card
- ✅ Small, muted styling (bottom-right corner)
- ✅ Shows "Flagged" after clicking (disabled)
- ✅ Reviews filtered to only show non-flagged (`is_flagged = false`)

### 5. Database Schema
- ✅ `is_flagged` column added to reviews table
- ✅ `flag_review_and_auto_hide()` SQL function
- ✅ Index on `is_flagged` for fast filtering

## 📁 Files Created/Modified

### New Files:
- `supabase-flagging-autohide.sql` - SQL for auto-hide system
- `HYBRID-VIBE-CHECK-FLAGGING.md` - Comprehensive documentation
- `IMPLEMENTATION-SUMMARY.md` - This file

### Modified Files:
- `lib/vibe-check.ts` - JSON response with reason
- `app/actions/review-actions.ts` - Hybrid check & auto-hide flagging
- `components/holistic/ReviewSection.tsx` - Filter flagged reviews
- `components/holistic/ReviewCard.tsx` - Flag button UI

## 🚀 Next Steps (For You)

### 1. Run SQL in Supabase

Open Supabase Dashboard → SQL Editor, then run:

```sql
-- Copy/paste entire contents of supabase-flagging-autohide.sql
```

This adds the `is_flagged` column and creates the auto-hide function.

### 2. Verify Environment Variables

Check `.env.local` has:
```env
OPENAI_API_KEY=sk-proj-vYZI... (your key is already added ✓)
```

### 3. Test the System

**Test AI Moderation (Guest):**
- Try submitting inappropriate content (should be blocked)
- Try submitting normal content (should pass)

**Test Flagging:**
- Flag a review by clicking the Flag button
- After 3 flags (from different users), it should disappear

### 4. Restart Dev Server (If Needed)

If environment variables were just added:
```bash
npm run dev
```

## 🎯 How It Works

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User Submits Review                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Authenticated? │
         └────┬───────┬───┘
              │       │
        YES   │       │   NO (Guest)
              │       │
              ▼       ▼
      ┌───────────┐  ┌──────────────┐
      │ Skip AI   │  │ AI Vibe Check│
      │ Check     │  │ (GPT-4o-mini)│
      └─────┬─────┘  └──────┬───────┘
            │                │
            │                ▼
            │        ┌──────────────┐
            │        │ Safe?        │
            │        └───┬──────┬───┘
            │            │      │
            │       YES  │      │ NO
            │            │      │
            └────────────┤      ▼
                         │  ┌────────────┐
                         │  │ Reject with│
                         │  │ AI Reason  │
                         │  └────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Insert Review   │
                └─────────────────┘
```

### Flagging Flow

```
User Clicks "Flag" Button
         │
         ▼
Call flagReview(reviewId)
         │
         ▼
Increment flag_count++
         │
         ▼
    flag_count >= 3?
         │
    YES  │  NO
         │
         ▼      ▼
Set is_flagged = true
         │
         ▼
Review Hidden from UI
```

## 📊 Database Schema Changes

```sql
reviews
├── id (UUID)
├── protocol_id (UUID)
├── user_id (TEXT)
├── rating (INT)
├── content (TEXT)
├── created_at (TIMESTAMPTZ)
├── helpful_count (INT)
├── flag_count (INT) ← Added earlier
└── is_flagged (BOOLEAN) ← NEW
```

## 🧪 Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify `is_flagged` column exists in reviews table
- [ ] Test guest submission with inappropriate content (should block)
- [ ] Test guest submission with safe content (should pass)
- [ ] Test authenticated submission (should bypass AI)
- [ ] Click Flag button on a review (should show "Flagged")
- [ ] Flag same review 3 times (should disappear)
- [ ] Verify flagged reviews don't appear in ReviewSection

## 💡 Key Design Decisions

### Why Hybrid (Not All Users)?
- **Trust**: Authenticated users are accountable
- **Cost**: Save API calls for trusted members
- **Speed**: No AI delay for registered users
- **Community**: Flagging system catches bad actors

### Why Auto-Hide at 3 Flags?
- **Balance**: Not too sensitive, not too lenient
- **Democratic**: Community decides what's inappropriate
- **Immediate**: No admin intervention needed
- **Reversible**: Admin can unhide if needed (future)

### Why Default to "Safe" on API Error?
- **User Experience**: Don't block legitimate users
- **Reliability**: System works even if OpenAI is down
- **Logging**: Errors are logged for manual review

## 🔐 Security Considerations

1. **Rate Limiting**: Add rate limits to prevent flag abuse (future)
2. **IP Tracking**: Track guest IPs to prevent spam (future)
3. **Admin Dashboard**: Review flagged content manually (future)
4. **Appeal System**: Let users contest AI rejections (future)

## 📈 Monitoring

Watch for:
- High AI rejection rates (too strict?)
- API errors (OpenAI down?)
- Mass flagging (coordinated abuse?)
- False positives (good reviews blocked)

## 🎉 All Done!

The system is fully implemented and ready to use. Just run the SQL migration and test it out!


