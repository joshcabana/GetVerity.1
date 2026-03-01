# Verity Evidence Pack (March 2, 2026 AEDT)

## Scope
Permanent ownership migration from Lovable-managed Supabase to user-owned Supabase with DB-driven auth policy preserved and fail-open continuity.

## Canonical Targets (post-cutover)
- Supabase project: `lixgbpgemcpdbjzhjknf`
- Supabase URL: `https://lixgbpgemcpdbjzhjknf.supabase.co`
- Primary domain: `https://getverity.com.au`

## Completed Actions
1. Created new user-owned Supabase project in org `mhjhvysqwuekjmjuizjr`.
   - Name: `verity-prod-owned`
   - Ref: `lixgbpgemcpdbjzhjknf`
2. Linked repository to new project.
   - Command: `npx supabase link --project-ref lixgbpgemcpdbjzhjknf`
3. Applied all migrations to new project.
   - Command: `npx supabase db push --linked`
   - Includes `20260302074500_app_config_feature_flags.sql` seed for `auth_policy`.
4. Deployed edge function `get-feature-flags` to new project.
   - Command: `npx supabase functions deploy get-feature-flags`
5. Updated runtime/canonical config references to new project:
   - `.env.production`
   - `supabase/config.toml`
   - `scripts/check-project-alignment.sh`
   - `README.md`
   - `docs/environment-matrix.md`
   - `docs/auth-unblock-runbook.md`
6. Opened PR with these repo updates:
   - PR: `https://github.com/joshcabana/spark-echo-verity/pull/20`
   - Branch: `codex/user-owned-supabase-cutover-20260302`
7. Merged PR #20 into `main`.
   - Merge commit: `8377513feebcf76ac70381444e5cf3d417233907`
   - `origin/main` now includes user-owned Supabase cutover docs/config.

## Verification Outputs

### Project alignment
`npm run check:project-alignment`
- PASS: canonical `lixgbpgemcpdbjzhjknf`

### Auth policy and providers
`npm run check:auth-settings`
- `disable_signup=false`
- `external.email=true`
- `external.phone=false`
- `external.google=false`
- `feature_flags.require_phone_verification=false`
- PASS with fallback warning (expected while phone provider is off)

### No hardcoded creds
`npm run check:no-hardcoded-supabase`
- PASS

### Local quality gates
- `npm run lint` -> PASS (0 errors, warnings only)
- `npm run test -- --run` -> PASS (25/25)
- `npm run build` -> PASS
- `npx tsc -b` -> PASS
- `npm audit --audit-level=moderate` -> PASS (0 vulnerabilities)

### Live endpoint checks
- `https://getverity.com.au` serves bundle: `assets/index-BMlIffKM.js`
- Routes return `200`: `/`, `/auth`, `/onboarding`, `/lobby`, `/tokens`
- `https://getverity.com` still serves legacy HTML redirect script to `/lander`
- DNS A records:
  - `getverity.com`: `15.197.148.33`, `3.33.130.190` (legacy)
  - `getverity.com.au`: `185.158.133.1`
- Post-merge note:
  - frontend auto-publish has not occurred yet (bundle hash unchanged after merge)
  - browser automation is currently unavailable in this environment (`Playwright transport closed`)

### New backend function check (owned project)
Direct call to `https://lixgbpgemcpdbjzhjknf.supabase.co/functions/v1/get-feature-flags`
- Response: `{ "require_phone_verification": false }`

## Remaining External Steps (not code-blocked)
1. Publish latest frontend build from hosting control plane (Lovable) so production bundle moves off `index-BMlIffKM.js` to a post-cutover hash.
2. Configure `.com` domain DNS/redirect:
   - Remove legacy A records `15.197.148.33`, `3.33.130.190`
   - Set 301 redirect from `getverity.com` and `www.getverity.com` to `https://getverity.com.au`
3. Configure auth providers on new Supabase project:
   - SMTP (if custom mail provider required)
   - Twilio phone OTP before strict mode
   - Google provider if social login is required
4. Strict mode activation (after Twilio validation):
   - SQL: set `auth_policy.value_json.require_phone_verification=true`
   - Re-run `npm run check:auth-settings`

## Notes
- Client fail-open continuity is already in `main` from PR #19.
- DB remains source of truth for phone verification policy (`app_config.auth_policy`).
