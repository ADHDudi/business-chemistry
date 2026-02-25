#!/bin/bash
set -e

# Configuration
PROJECT_NAME="business-chemistry"
TEMP_DIR="/tmp/${PROJECT_NAME}-deploy"
PROJECT_DIR="$(pwd)"

echo "🚀 Starting deployment workaround..."

# 1. Prepare temporary directory
echo "📁 Preparing temporary directory: ${TEMP_DIR}"
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

# Set TMPDIR to a local directory to avoid system temp permission issues
export TMPDIR="${TEMP_DIR}/tmp"
mkdir -p "$TMPDIR"

# 2. Sync project files
echo "📦 Syncing project files..."
# Exclude node_modules, dist, and other non-essential/locked files
rsync -av \
    --exclude "node_modules" \
    --exclude "functions/node_modules" \
    --exclude ".git" \
    --exclude "dist" \
    --exclude ".firebase" \
    --exclude ".DS_Store" \
    . "${TEMP_DIR}" || [ $? -eq 23 ]

# 3. Install dependencies and build frontend
echo "🛠️ Installing frontend dependencies and building..."
cd "${TEMP_DIR}"
# We use a local cache within the temp to avoid global cache permission issues if they persist
npm install --cache "${TEMP_DIR}/.npm-cache"
npm run build

# 4. Install backend dependencies
echo "🛠️ Installing backend dependencies..."
cd functions
# Copy the .env file if it wasn't picked up (though rsync should have caught it)
if [ -f "${PROJECT_DIR}/functions/.env" ] && [ ! -f .env ]; then
    cp "${PROJECT_DIR}/functions/.env" .
fi
npm install --cache "${TEMP_DIR}/.npm-cache-functions"

# 5. Deploy
echo "🔥 Deploying to Firebase..."
cd "${TEMP_DIR}"
firebase deploy

echo "✅ Deployment complete!"
