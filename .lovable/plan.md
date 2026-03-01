

## Review Results: 15 Changed Files + Security Scan + Architecture Check

### Security Scan Result
The database linter returned **no issues**. All RLS policies are properly configured, including the deny-all policy on `stripe_processed_events`.

### Files Reviewed — Status

All 9 fixes from the quality assessment have been correctly implemented:

| Fix | Status | Verified |
|-----|--------|----------|
| Stripe secrets configured | Done | Secrets exist in config |
| Appeal page wired to real data | Done | Queries `moderation_flags` + `appeals`, calls `submit-appeal` |
| RLS deny-all on `stripe_processed_events` | Done | Linter clean |
| `create-checkout` uses `stripe_customer_id` | Done | Lookup/create pattern implemented |
| `getverity.com.au` in ALLOWED_ORIGINS | Done | Both `create-checkout` and `customer-portal` |
| `constructEventAsync` in webhook | Done | Line 38 |
| `safe-area-bottom` CSS utility | Done | In `index.css` |
| Dead `spark` removed from VerityLogo | Done | No unused variable |
| `useAgoraCall` deps fixed | Done | `join` and `leave` in deps array (line 128) |

### Remaining Issues Found (2 items)

**1. `customer-portal` still uses email lookup instead of `stripe_customer_id`**
`customer-portal/index.ts` line 64 does `stripe.customers.list({ email: customerEmail })` instead of first checking the profile's `stripe_customer_id`. This is inconsistent with the `create-checkout` fix — the same pattern should be applied here.

**Fix:** In `customer-portal/index.ts`, query the user's profile for `stripe_customer_id` first. Only fall back to email lookup if not found.

**2. BottomNav "Home" tab navigates to `/` (landing page)**
`BottomNav.tsx` line 6: the "Home" tab points to `/` which is the public landing page, not the authenticated lobby. For logged-in users, this should point to `/lobby`.

**Fix:** Change the Home tab path from `/` to `/lobby`.

### Files with No Issues
- `DropCard.tsx` — Clean, well-structured
- `PhoneVerifyStep.tsx` — Proper OTP flow, good error handling
- `PreferencesStep.tsx` — Clean, queries rooms from DB correctly
- `SignInStep.tsx` — Proper email OTP flow
- `SparkCard.tsx` — Clean
- `Auth.tsx` — Proper signup/login with onboarding redirect
- `LiveCall.tsx` — Complex but well-structured, good realtime subscription cleanup
- `SparkHistory.tsx` — Proper partner name resolution
- `find-match/index.ts` — Good atomic matching with block filtering and rollback
- `AppHeader.tsx` — Clean route-based visibility
- `VerityLogo.tsx` — Dead code removed successfully
- `useAgoraCall.ts` — Deps fixed correctly

### Implementation Plan (2 remaining fixes)

| # | Fix | File |
|---|-----|------|
| 1 | Use `stripe_customer_id` in customer-portal (match create-checkout pattern) | `supabase/functions/customer-portal/index.ts` |
| 2 | Change BottomNav Home tab path from `/` to `/lobby` | `src/components/BottomNav.tsx` |

