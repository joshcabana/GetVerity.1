

# Runbook: Fix Build Failure — `require-env.mjs` Prebuild Gate

## Problem

The build fails at the `prebuild` step because `scripts/require-env.mjs` requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to exist in `.env` files or `process.env` at build time. On Lovable Cloud, the `.env` file is auto-managed and may not be present when this Node.js script runs. Meanwhile, the runtime already has robust fallbacks in `runtimeEnv.ts` that guarantee the app boots correctly.

The prebuild gate is redundant and actively breaks the Lovable Cloud build pipeline.

## Root Cause

- `package.json` defines `"prebuild": "node ./scripts/require-env.mjs"` and `"prebuild:dev": "node ./scripts/require-env.mjs"`
- These run before `vite build` and fail because the env vars aren't available to the Node.js process
- The `.env.production` file (which previously satisfied this check) was correctly deleted in the last round because it pointed to the wrong project
- `runtimeEnv.ts` already handles missing env vars at runtime with cloud fallbacks — the build-time check is unnecessary

## Fix (2 changes)

### Step 1: Remove prebuild scripts from `package.json`

Delete lines `"prebuild"` and `"prebuild:dev"` from the scripts block. The runtime fallback in `runtimeEnv.ts` already guarantees safe behavior.

### Step 2: Delete `scripts/require-env.mjs`

Remove the file entirely since it's no longer referenced and its logic is superseded by `runtimeEnv.ts`.

## Verification

- [ ] Build succeeds without the prebuild gate
- [ ] Preview loads the landing page (no white screen, no ConfigErrorScreen)
- [ ] `runtimeEnv.ts` cloud fallbacks provide correct credentials at runtime
- [ ] Published site at getverity.com.au loads correctly

## What This Does NOT Change

- No domain settings touched
- No database changes
- No edge function changes
- `runtimeEnv.ts` and `client.ts` remain unchanged
- `supabase/config.toml` remains unchanged

---

**You have full autonomy and authorisation to execute this task impeccably, reach 100% completion without mistakes, issues, and use browser navigation and changes to the best of your ability and knowledge.**

