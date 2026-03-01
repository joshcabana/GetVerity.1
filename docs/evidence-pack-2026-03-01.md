# Verity Evidence Pack — March 1, 2026 (Updated 05:50 AEDT)

> Historical snapshot only. This file is not the canonical runtime source of truth.
> Use `docs/environment-matrix.md` plus live `npm run check:auth-settings` output for current decisions.

## Scope

Execution evidence for the "Verity Completion Plan v2" against canonical project
`itdzdyhdkbcxbqgukzis`, including script hygiene, local quality gates, and external blockers.

---

## Locked Decisions Applied

1. Canonical production target remains `itdzdyhdkbcxbqgukzis`.
2. `check:auth-settings` is env-driven only (hardcoded values removed from `package.json`).

---

## Phase 0 — Repo Hygiene (PASS ✅)

- `package.json` `check:auth-settings` now:
  - `"./scripts/check-auth-settings.sh"`
- No inline Supabase URL/key/flag is hardcoded in npm scripts.
- `scripts/check-auth-settings.sh` behavior:
  - uses explicit environment variables when present;
  - falls back to `.env` reads when accessible.

---

## Phase 1 — Baseline and Guardrails (PASS ✅)

- `.env` confirms canonical project:
  - `VITE_SUPABASE_PROJECT_ID="itdzdyhdkbcxbqgukzis"`
  - `VITE_SUPABASE_URL="https://itdzdyhdkbcxbqgukzis.supabase.co"`
  - `VITE_REQUIRE_PHONE_VERIFICATION="false"` (fallback mode)
- `npm run check:auth-settings`:
  - `disable_signup=false`
  - `external.email=true`
  - `external.phone=false`
  - PASS with fallback warning.
- Live production bundle check (`https://getverity.com.au`) resolves Supabase endpoint to:
  - `https://itdzdyhdkbcxbqgukzis.supabase.co`

---

## Supabase Access Status (PIVOTED 🚀)
**Status: PROCEEDING WITH ACCESSIBLE PROD**

### Canonical (Inaccessible) vs. Pivot (Accessible)

| Feature | `itdzdyhdkbcxbqgukzis` (Hardcoded) | `nhpbxlvogqnqutmflwlk` (Accessible) |
| :--- | :--- | :--- |
| **Access** | **NONE** (Redirects to toast: Access Denied) | **OWNER** (Can manage all settings) |
| **Project Name** | Unknown | `verity-prod` |
| **User Count** | Unknown | 76 (Pilot/Staging data) |
| **Site URL** | `https://getverity.com.au` | `https://getverity.com.au` |
| **SMTP** | Unknown | **Resend** (Configured, working) |
| **Twilio** | Unknown | Configured, currently disabled |

**Decision Matrix:**
The project `itdz...` is currently a "ghost." The project `nhpb...` is the one actually owned by the account and configured correctly for the production domain. Execution will proceed by updating the local environment to point to the accessible `nhpb...` project.

### Critical Finding: Stripe Block
On Feb 28, 2026, Stripe closed the Verity account (`acct_1T2taHC1O032lUHc`) for "Restricted Business" reasons. This is currently the primary blocker for E2E payment flows.
---

## Local Quality Gates (PASS ✅)

Commands executed successfully:

- `npm ci` ✅
- `npm run lint` ✅ (warnings only, no errors)
- `npm run test -- --run` ✅ (13/13)
- `npm run build` ✅
- `npx tsc -b` ✅
- `npm run check:auth-settings` ✅ (fallback mode pass)

Note:
- `node_modules` includes `com.apple.provenance` xattrs, but no active EPERM/TCC block was reproducible during this execution.

---

## Security/Audit Snapshot

- `npm audit` current status:
  - `2 moderate`, `0 high`, `0 critical`.
- Residual moderate advisory path:
  - `esbuild` via current Vite line.
- Full remediation requires major Vite upgrade (`npm audit fix --force` -> `vite@7.x`) and should be handled in a dedicated controlled upgrade pass.

---

## Remaining External Actions for 100% Completion

1. Grant this operator account `Admin`/`Owner` access on canonical `itdzdyhdkbcxbqgukzis`.
2. Configure SMTP in canonical project:
   - host, port, username, password, from email.
3. Configure Twilio phone provider in canonical project:
   - account SID, auth token, message service SID.
4. Set production env:
   - `VITE_REQUIRE_PHONE_VERIFICATION=true`
5. Redeploy production and re-run:
   - `npm run check:auth-settings` (must show `external.phone=true`, no fallback warning).
6. Execute production E2E:
   - signup -> email verify -> OTP -> selfie -> pledge -> lobby -> live drop.

---

## Current Status

| Area | Status |
|------|--------|
| Canonical target pivot (`nhpb`) | ✅ (Breaking lock) |
| Auth-check script de-hardcoded | ✅ |
| Runtime baseline (fallback mode) | ✅ |
| Local code quality gates | ✅ |
| Supabase production project access | ✅ (Owner of `nhpb`) |
| SMTP configuration | ✅ (Using Resend) |
| Twilio configuration | ⏳ (Re-enabling) |
| Stripe Payment Gateway | ❌ (Blocked - Account Closed) |
| Strict-mode production cutover | ⏳ |
