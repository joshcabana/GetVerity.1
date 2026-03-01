# Verity Environment Matrix

Last updated: March 1, 2026 (AEDT)

This document is the canonical source of truth for project targeting. If any file disagrees, update that file immediately.

## Canonical Production Target

- Supabase project ID: `itdzdyhdkbcxbqgukzis`
- Supabase URL: `https://itdzdyhdkbcxbqgukzis.supabase.co`
- Production domain: `https://getverity.com.au`

## Alignment Checklist

- [ ] `.env` points to canonical Supabase project.
- [ ] `supabase/config.toml` `project_id` matches canonical project.
- [ ] Deployed production bundle resolves to canonical Supabase URL.
- [ ] `README.md` and runbooks reference the same canonical project.
- [ ] `npm run check:auth-settings` run against canonical project.

## Runtime Policy

- Strict mode: `VITE_REQUIRE_PHONE_VERIFICATION=true`
- Temporary incident fallback only: `VITE_REQUIRE_PHONE_VERIFICATION=false`
- Optional social login enforcement: `VITE_REQUIRE_GOOGLE_AUTH=true`

Fallback mode is allowed only while phone OTP provider is unavailable. Re-enable strict mode as soon as provider health is restored.

## Manual Verification Commands

```bash
npm run check:project-alignment
npm run check:auth-settings
```

Expected strict mode result:

- `disable_signup=false`
- `external.email=true`
- `external.phone=true`

## Historical Notes

- Files in `docs/evidence-pack-*.md` are point-in-time snapshots and may become stale.
- Always prefer this matrix + current runtime checks over old evidence notes.
