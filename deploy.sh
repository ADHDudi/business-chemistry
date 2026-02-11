#!/bin/bash
set -e

# Configuration
PROJECT_NAME="business-chemistry"
TEMP_BUILD_DIR="/private/tmp/${PROJECT_NAME}-build"
PROJECT_DIR="$(pwd)"
LOCAL_CACHE="${PROJECT_DIR}/local_npm_cache"

echo "🚀 Starting automated deployment workaround..."

# 1. Prepare temporary directory
echo "📁 Preparing temporary build directory: ${TEMP_BUILD_DIR}"
rm -rf "${TEMP_BUILD_DIR}"
mkdir -p "${TEMP_BUILD_DIR}"

# 2. Sync project files (excluding locked/heavy dirs)
echo "📦 Syncing project files..."
# Ignore status 23 (some files could not be transferred)
rsync -av --progress . "${TEMP_BUILD_DIR}" \
    --exclude "node_modules" \
    --exclude ".git" \
    --exclude "dist" \
    --exclude ".firebase" \
    --exclude ".npm-cache" \
    --exclude "local_npm_cache" \
    --exclude ".DS_Store" || [ $? -eq 23 ]

# 3. Install dependencies and build in temp dir
echo "🛠️ Installing dependencies and building in temporary directory..."
cd "${TEMP_BUILD_DIR}"
npm install --cache "${LOCAL_CACHE}" --prefer-offline
./node_modules/.bin/vite build

# 4. Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy

# 5. Git synchronization in original project dir
echo "📂 Synchronizing Git in original directory..."
cd "${PROJECT_DIR}"
git add .
git commit -m "Auto-deploy: $(date)"
git push

echo "✅ Deployment complete! View at https://business-chemistry.web.app/"
