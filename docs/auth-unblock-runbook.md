# Auth Unblock Runbook (`itdzdyhdkbcxbqgukzis`)

Canonical Supabase project: `itdzdyhdkbcxbqgukzis`

Primary source of truth: [docs/environment-matrix.md](./environment-matrix.md)

## 1) Validate Runtime Target

Confirm these point to the same project:

- `.env` (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`)
- `supabase/config.toml` (`project_id`)
- deployed site bundle endpoint

Do not repoint to `nhpbxlvogqnqutmflwlk` unless running a planned migration.

## 2) Configure Providers in Supabase Dashboard

Project: `itdzdyhdkbcxbqgukzis`

1. `Authentication -> SMTP Settings`
- Set host, port, username, password, sender email.
- Confirm domain SPF + DKIM + DMARC.

2. `Authentication -> Providers -> Phone`
- Enable provider.
- Set Twilio Account SID, Auth Token, Message Service SID.

## 3) Hard Validation

Run:

```bash
npm run check:auth-settings
```

Expected:
- `disable_signup=false`
- `external.email=true`
- `external.phone=true` when `VITE_REQUIRE_PHONE_VERIFICATION=true`

## 4) Fallback Policy

Default strict mode:

```env
VITE_REQUIRE_PHONE_VERIFICATION=true
```

Temporary incident mode (only if SMS provider is down):

```env
VITE_REQUIRE_PHONE_VERIFICATION=false
```

When fallback mode is active:
- Onboarding can continue without phone OTP.
- Lobby gate requires selfie + safety pledge.
- UI shows continuity-mode notice.

Re-enable strict mode immediately after phone provider recovery and redeploy.

## 5) End-to-End Verification Checklist

1. Sign up at `/auth` with a fresh email.
2. Verify email arrives and link works.
3. Complete onboarding phone OTP in strict mode.
4. Reach `/lobby` and join a live Drop.
