#!/bin/bash
# ==============================================================================
# Bond — Deploy Script
# Checks, tests against a local dev server, then deploys to Firebase Hosting +
# Functions. Only deploys what is on origin/main — changes reach main via PRs.
#
# Prerequisites:
#   - firebase CLI logged in  (run: firebase login)
#   - git remote 'origin' configured
#   - functions/.env file present locally with GEMINI_API_KEY (never committed)
#   - .env.test with the E2E test accounts (never committed)
#
# Options (env vars):
#   DRY_RUN=1   run every check and the E2E suite, but don't deploy
#   SKIP_E2E=1  skip the E2E suite (emergencies only)
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

DEV_PORT=3099
PROD_URL="https://business-chemistry.web.app/"

fail() { echo ""; echo "❌ $1"; exit 1; }

echo "🚀 Starting deployment for Bond..."

# ── 1. Git: only deploy an up-to-date main ────────────────────────────────────
echo ""
echo "📦 Checking git state..."

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "main" ] || fail "On branch '$BRANCH'. Deploy from main: git switch main && git pull"

[ -z "$(git status --porcelain)" ] || { git status --short; fail "Uncommitted changes. Land them on main through a PR first."; }

git fetch origin main --quiet
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] \
  || fail "Local main differs from origin/main. Run: git pull (and push any local commits through a PR)."
echo "✅ main is clean and up to date ($(git rev-parse --short HEAD))."

# ── 2. Install frontend dependencies ──────────────────────────────────────────
echo ""
echo "📥 Installing frontend dependencies..."
npm install

# ── 3. Unit tests ──────────────────────────────────────────────────────────────
echo ""
echo "🧪 Running unit tests..."
npm run test:unit

# ── 4. E2E suite against a local dev server ───────────────────────────────────
if [ "$SKIP_E2E" = "1" ]; then
  echo ""
  echo "⚠️  SKIP_E2E=1 — skipping the E2E suite. Use for emergencies only."
else
  echo ""
  echo "🌐 Starting dev server on port $DEV_PORT..."
  [ -f .env.test ] || fail ".env.test not found — the signed-in E2E suites would be skipped. Add it, or use SKIP_E2E=1 in an emergency."

  # The Puppeteer-managed Chrome can be incomplete; fall back to the installed Chrome on macOS
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [ -z "$PUPPETEER_EXECUTABLE_PATH" ] && [ -x "$CHROME" ]; then
    export PUPPETEER_EXECUTABLE_PATH="$CHROME"
  fi

  DEV_LOG="$(mktemp -t bond-dev-server)"
  BROWSER=none npx vite --port "$DEV_PORT" --strictPort > "$DEV_LOG" 2>&1 &
  DEV_PID=$!
  trap 'kill $DEV_PID 2>/dev/null || true' EXIT

  for _ in $(seq 1 30); do
    curl -s -o /dev/null "http://localhost:$DEV_PORT/" && break
    kill -0 $DEV_PID 2>/dev/null || { cat "$DEV_LOG"; fail "Dev server failed to start (is port $DEV_PORT in use?)."; }
    sleep 1
  done
  curl -s -o /dev/null "http://localhost:$DEV_PORT/" || { cat "$DEV_LOG"; fail "Dev server did not answer on port $DEV_PORT within 30s."; }
  echo "✅ Dev server is up."

  echo ""
  echo "🧪 Running the E2E suite against http://localhost:$DEV_PORT/ ..."
  node e2e/run.js "http://localhost:$DEV_PORT/" \
    || fail "E2E suite failed — not deploying. See e2e/report.html."

  kill $DEV_PID 2>/dev/null || true
  trap - EXIT
  echo "✅ E2E suite passed."
fi

if [ "$DRY_RUN" = "1" ]; then
  echo ""
  echo "✅ DRY_RUN=1 — all checks passed. Nothing was deployed."
  exit 0
fi

# ── 5. Build frontend ──────────────────────────────────────────────────────────
echo ""
echo "🛠️  Building frontend..."
npm run build
BUNDLE=$(basename "$(ls dist/assets/index-*.js | head -1)")

# ── 6. Install functions dependencies ─────────────────────────────────────────
echo ""
echo "📥 Installing Cloud Functions dependencies..."
cd functions
npm install
cd "$PROJECT_DIR"

# ── 7. Deploy to Firebase ──────────────────────────────────────────────────────
echo ""
echo "🔥 Deploying to Firebase..."
firebase deploy

# ── 8. Confirm production serves this build ───────────────────────────────────
echo ""
echo "🔎 Checking that production serves the new build..."
if curl -s "${PROD_URL}?deploy-check=$(date +%s)" | grep -q "$BUNDLE"; then
  echo "✅ Production is serving $BUNDLE."
else
  echo "⚠️  Production doesn't reference $BUNDLE yet — it may be cached. Check $PROD_URL in a minute."
fi

echo ""
echo "✅ Deployment complete! ($(git rev-parse --short HEAD) → production)"
echo "🌍 App is live at: $PROD_URL"
