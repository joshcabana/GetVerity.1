#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for this script" >&2
  exit 1
fi

read_env_var() {
  local key="$1"
  # Prefer env var already set in environment
  local env_val
  env_val="$(printenv "$key" 2>/dev/null || true)"
  if [[ -n "$env_val" ]]; then
    echo "$env_val"
    return 0
  fi
  # Fall back to reading from .env file if accessible
  if [[ ! -f "$ENV_FILE" ]]; then
    echo ""
    return 0
  fi
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return 0
  fi
  local value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  echo "$value"
}

SUPA_URL="$(read_env_var "VITE_SUPABASE_URL")"
ANON_KEY="$(read_env_var "VITE_SUPABASE_PUBLISHABLE_KEY")"
REQUIRE_PHONE_FLAG="$(read_env_var "VITE_REQUIRE_PHONE_VERIFICATION")"
REQUIRE_PHONE="${REQUIRE_PHONE_FLAG:-true}"
REQUIRE_PHONE_LOWER="$(echo "$REQUIRE_PHONE" | tr '[:upper:]' '[:lower:]')"

if [[ -z "$SUPA_URL" || -z "$ANON_KEY" ]]; then
  echo "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in $ENV_FILE" >&2
  exit 1
fi

SETTINGS_JSON="$(
  curl -fsS "$SUPA_URL/auth/v1/settings" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY"
)"

echo "$SETTINGS_JSON" | jq '{disable_signup, mailer_autoconfirm, external:{email:.external.email, phone:.external.phone}}'

DISABLE_SIGNUP="$(echo "$SETTINGS_JSON" | jq -r '.disable_signup')"
EMAIL_ENABLED="$(echo "$SETTINGS_JSON" | jq -r '.external.email')"
PHONE_ENABLED="$(echo "$SETTINGS_JSON" | jq -r '.external.phone')"

if [[ "$DISABLE_SIGNUP" != "false" ]]; then
  echo "FAIL: disable_signup must be false." >&2
  exit 2
fi

if [[ "$EMAIL_ENABLED" != "true" ]]; then
  echo "FAIL: external.email must be true." >&2
  exit 2
fi

if [[ "$REQUIRE_PHONE_LOWER" == "true" && "$PHONE_ENABLED" != "true" ]]; then
  echo "FAIL: external.phone must be true while VITE_REQUIRE_PHONE_VERIFICATION=true." >&2
  exit 2
fi

if [[ "$REQUIRE_PHONE_LOWER" != "true" && "$PHONE_ENABLED" != "true" ]]; then
  echo "WARN: phone provider is disabled and fallback mode is active." >&2
fi

echo "PASS: Auth settings match current runtime policy."
