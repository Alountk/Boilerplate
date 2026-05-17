#!/usr/bin/env bash

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://vmarket-api.marchan.dev}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-https://vmarket.marchan.dev}"
LOGIN_EMAIL="${LOGIN_EMAIL:-}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-}"

pass() {
  echo "[PASS] $1"
}

fail() {
  echo "[FAIL] $1"
  exit 1
}

section() {
  echo
  echo "== $1 =="
}

section "Health"
health_body="$(curl -fsS "${API_BASE_URL}/api/health")" || fail "Health endpoint is not reachable"
echo "$health_body" | grep -q '"status":"ok"' || fail "Health response does not contain status ok"
pass "Health endpoint responds with status ok"

section "CORS preflight (SignalR negotiate)"
cors_headers="$(curl -sS -D - -o /dev/null -X OPTIONS "${API_BASE_URL}/api/chat/negotiate?negotiateVersion=1" \
  -H "Origin: ${FRONTEND_ORIGIN}" \
  -H "Access-Control-Request-Method: POST")"
cors_headers_clean="$(echo "$cors_headers" | tr -d '\r')"

echo "$cors_headers_clean" | grep -qi "^HTTP/.* 204" || fail "CORS preflight did not return HTTP 204"
echo "$cors_headers_clean" | grep -qi "^access-control-allow-origin: ${FRONTEND_ORIGIN}$" || fail "CORS allow-origin header mismatch"
pass "CORS preflight allows ${FRONTEND_ORIGIN}"

section "Auth route"
auth_get_status="$(curl -sS -o /dev/null -w "%{http_code}" "${API_BASE_URL}/api/auth/login")"
[[ "$auth_get_status" == "405" ]] || fail "Expected GET /api/auth/login to return 405, got ${auth_get_status}"
pass "Auth login route is exposed and restricted to POST"

if [[ -n "$LOGIN_EMAIL" && -n "$LOGIN_PASSWORD" ]]; then
  section "Login"
  login_payload="$(printf '{"email":"%s","password":"%s"}' "$LOGIN_EMAIL" "$LOGIN_PASSWORD")"
  login_body_file="$(mktemp)"
  login_status="$(curl -sS -o "$login_body_file" -w "%{http_code}" \
    -X POST "${API_BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$login_payload")"

  if [[ "$login_status" == "200" ]]; then
    grep -q '"token"' "$login_body_file" || fail "Login returned 200 but no token in response"
    pass "Login succeeded and returned a token"
  else
    echo "Response body:"
    cat "$login_body_file"
    fail "Login failed with status ${login_status}"
  fi

  rm -f "$login_body_file"
else
  section "Login"
  echo "Skipping login test (set LOGIN_EMAIL and LOGIN_PASSWORD to enable it)."
fi

echo
echo "Smoke test completed successfully."