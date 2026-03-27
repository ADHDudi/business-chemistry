#!/bin/bash
# ==============================================================================
# Business Chemistry — Deploy Script
# Commits to GitHub and deploys to Firebase Hosting + Functions.
#
# Prerequisites:
#   - firebase CLI logged in  (run: firebase login)
#   - git remote 'origin' configured
#   - functions/.env file present locally with GEMINI_API_KEY (never committed)
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting deployment for Business Chemistry..."

# ── 1. Git: commit & push ──────────────────────────────────────────────────────
echo ""
echo "📦 Syncing with GitHub..."

git add .

if [ -n "$(git status --porcelain)" ]; then
  git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "✅ Changes committed."
else
  echo "ℹ️  Nothing new to commit."
fi

BRANCH=$(git branch --show-current)
git push -u origin "$BRANCH"
echo "✅ Pushed to GitHub ($BRANCH)."

# ── 2. Install frontend dependencies ──────────────────────────────────────────
echo ""
echo "📥 Installing frontend dependencies..."
npm install

# ── 3. Build frontend ──────────────────────────────────────────────────────────
echo ""
echo "🛠️  Building frontend..."
npm run build

# ── 4. Install functions dependencies ─────────────────────────────────────────
echo ""
echo "📥 Installing Cloud Functions dependencies..."
cd functions
npm install
cd "$PROJECT_DIR"

# ── 5. Deploy to Firebase ──────────────────────────────────────────────────────
echo ""
echo "🔥 Deploying to Firebase..."
firebase deploy

echo ""
echo "✅ Deployment complete!"
echo "🌍 App is live at: https://business-chemistry.web.app/"
