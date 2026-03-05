

## Comprehensive Error & Placeholder Audit

### Findings

**1. Dead placeholder page: `src/pages/Index.tsx`**
- Contains "Welcome to Your Blank App" boilerplate text
- Not referenced in any route or import — completely dead code
- **Action**: Delete the file

**2. Mock data files still present: `src/data/sparks.ts`**
- Contains `mockSparks` and `mockMessages` with hardcoded fake users (Lena, James, Priya, Oliver)
- Not imported anywhere in production code (all pages query the real database)
- **Action**: Delete the file (keep only if tests depend on it — they don't)

**3. Stripe Price ID TODO comments (not blocking)**
- `supabase/functions/create-checkout/index.ts` and `stripe-webhook/index.ts` both have prominent `PRODUCTION TODO` comment blocks saying "Replace each placeholder key below with the real Stripe Price ID"
- However, the actual Price IDs (`price_1T6rXLC1O...`) are real Stripe format IDs, suggesting they've already been replaced. The TODO comments are now stale and misleading
- **Action**: Remove the TODO comment blocks from both files, keeping just a brief inline note

**4. Static room data: `src/data/rooms.ts`**
- Contains 5 hardcoded rooms with static occupancy numbers (e.g., `occupancy: 142`)
- These are frontend-only display values, not live data
- **Action**: No code change required, but worth noting — occupancy should eventually come from the database. Low priority.

**5. No other issues found**
- All secrets (Agora, Stripe, VAPID, AI keys) are configured
- No console errors
- No hardcoded credentials in source
- All `placeholder` attributes on form inputs are legitimate UX (not content placeholders)
- `getverity.com.au` domain references are intentional (canonical URLs, contact emails)
- `hasFakeCaret` in `input-otp.tsx` is a library internal, not a placeholder

### Plan

| # | Task | Files |
|---|------|-------|
| 1 | Delete dead `Index.tsx` placeholder page | `src/pages/Index.tsx` |
| 2 | Delete unused mock data file | `src/data/sparks.ts` |
| 3 | Clean up stale PRODUCTION TODO comments in Stripe functions | `supabase/functions/create-checkout/index.ts`, `supabase/functions/stripe-webhook/index.ts` |

