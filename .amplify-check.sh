#!/usr/bin/env bash
# amplify-check.sh — poll Amplify build status after a push
# Usage: ./.amplify-check.sh [branch] [commit-sha]
#
# Strategy: Amplify doesn't report commit statuses to GitHub by default.
# IAM user spac-cli has no amplify:ListJobs permission.
# Current approach: poll the live app URL for 200 + check for build error indicators.
# To enable proper Amplify API polling, add these to spac-cli IAM policy:
#   amplify:GetJob, amplify:ListJobs, amplify:GetApp, amplify:ListApps

set -euo pipefail

BRANCH="${1:-}"
COMMIT="${2:-}"
APP_URL="https://main.dw31ke605du7u.amplifyapp.com"
PAT="${GITHUB_PAT:-}"
REPO="Qruxy/spac-website"
MAX_WAIT=600   # 10 minutes
POLL_INTERVAL=20

echo "[amplify-check] Branch: $BRANCH | Commit: ${COMMIT:0:8}"
echo "[amplify-check] Waiting for Amplify build to start..."

START=$(date +%s)
LAST_STATUS=""

while true; do
  NOW=$(date +%s)
  ELAPSED=$((NOW - START))

  if [ $ELAPSED -gt $MAX_WAIT ]; then
    echo "[amplify-check] TIMEOUT: build not confirmed after ${MAX_WAIT}s"
    exit 1
  fi

  # Check GitHub commit status (works if Amplify CI integration is enabled)
  if [ -n "$PAT" ] && [ -n "$COMMIT" ]; then
    STATUS=$(curl -sf -H "Authorization: Bearer $PAT" \
      "https://api.github.com/repos/${REPO}/statuses/${COMMIT}" \
      | python3 -c "
import sys,json
ss=json.load(sys.stdin)
if ss:
    latest=ss[0]
    print(latest['state']+'|'+latest.get('context','')+'|'+latest.get('description','')[:50])
else:
    print('pending|none|no statuses yet')
" 2>/dev/null || echo "pending|check-failed|")

    STATE=$(echo "$STATUS" | cut -d'|' -f1)
    CTX=$(echo "$STATUS" | cut -d'|' -f2)
    DESC=$(echo "$STATUS" | cut -d'|' -f3)

    if [ "$STATE" = "success" ]; then
      echo "[amplify-check] BUILD PASSED ($CTX: $DESC)"
      exit 0
    elif [ "$STATE" = "failure" ] || [ "$STATE" = "error" ]; then
      echo "[amplify-check] BUILD FAILED ($CTX: $DESC)"
      exit 2
    fi
  fi

  # Fallback: HTTP probe the live URL
  HTTP=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL" 2>/dev/null || echo "000")
  if [ "$HTTP" != "$LAST_STATUS" ]; then
    echo "[amplify-check] ${ELAPSED}s — app URL status: $HTTP"
    LAST_STATUS="$HTTP"
  fi

  echo "[amplify-check] ${ELAPSED}s — waiting... (next check in ${POLL_INTERVAL}s)"
  sleep $POLL_INTERVAL
done
