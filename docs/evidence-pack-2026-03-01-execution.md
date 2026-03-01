# Verity Execution Evidence Pack — March 1, 2026 (Phase Implementation)

Generated: 2026-03-01 AEDT
Workspace: `/Users/joshcabana/Documents/spark-echo-verity-main`

## Scope

Execution evidence for the implemented remediation set:
- moderation contract alignment
- customer portal return URL safety
- Stripe webhook lifecycle expansion
- performance preload strategy adjustment
- source-of-truth matrix/document alignment

## Canonical Target and Runtime Baseline

- Canonical project set in local config: `itdzdyhdkbcxbqgukzis`
- `.env` currently points to `itdzdyhdkbcxbqgukzis`
- `supabase/config.toml` currently points to `itdzdyhdkbcxbqgukzis`
- `npm run check:auth-settings` output:
  - `disable_signup=false`
  - `external.email=true`
  - `external.phone=false`
  - PASS with fallback warning.

## Quality Gates

Commands run:

1. `npm ci` ✅
2. `npm run test -- --run` ✅ (15/15)
3. `npm run build` ✅
4. `npx tsc -b` ✅
5. `npm run check:auth-settings` ✅ (fallback warning expected)
6. `npm audit --audit-level=moderate` ⚠️
   - 2 moderate advisories (`esbuild` via Vite)
   - fix path requires breaking major update (`vite@7`).
7. `npm run lint` ✅ (0 errors, 8 warnings)
   - Note: one transient ENOENT occurred when lint was launched concurrently with other jobs.
   - Re-run sequentially succeeded.

## Live Site vs Local Build Delta

- Live [getverity.com.au](https://getverity.com.au): still includes module preloads for `agora`, `framer-motion`, `chart`.
- Local `dist/index.html`: no modulepreload tags for those heavy chunks.
- Interpretation: remediation is present locally but not deployed to the currently live bundle.

## Browser/Ops Execution (Supabase)

Attempted project: `https://supabase.com/dashboard/project/itdzdyhdkbcxbqgukzis/auth/providers`

Observed state in dashboard snapshot:
- `Authentication` nav section disabled
- `Database` nav section disabled
- `Storage` nav section disabled
- Auth subpages (URL Configuration/Providers) shown as disabled in sidebar

Conclusion:
- SMTP + Twilio provider setup is blocked by project permissions for the active account/session.
- This prevents completion of strict-mode readiness steps from this environment.

Screenshot artifact:
- `supabase-itdz-permission-block.png`

## Implemented Files (Code/Config/Docs)

- `src/lib/moderation.ts`
- `src/pages/LiveCall.tsx`
- `supabase/functions/ai-moderate/index.ts`
- `src/pages/TokenShop.tsx`
- `supabase/functions/customer-portal/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/_shared/url-validation.test.ts`
- `src/test/liveCallModerationWiring.test.ts`
- `vite.config.ts`
- `supabase/config.toml`
- `docs/environment-matrix.md`
- `README.md`
- `docs/auth-unblock-runbook.md`
- `docs/evidence-pack-2026-03-01.md`

## Remaining External Blockers to Reach 100%

1. Supabase project permissions on `itdz...`
   - grant Admin/Owner access for the active operator account so Auth/DB/Storage are configurable.
2. Twilio credentials
   - Account SID, Auth Token, Message Service SID required to enable phone OTP.
3. SMTP credentials + verified domain
   - host/port/user/password/from and SPF/DKIM/DMARC alignment.
4. Deployment of local changes to production
   - live site still running older bundle with heavy preloads.
5. Optional dependency hardening
   - resolve moderate Vite/esbuild advisory through controlled major upgrade.

## Completion Status

- Local implementation: complete for targeted code remediations ✅
- Local technical validation: complete ✅
- Operational strict-mode readiness: blocked by permissions/credentials ⛔
- Live production parity with local build: pending deployment ⏳
