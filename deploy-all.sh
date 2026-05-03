#!/bin/bash
# ============================================================================
# Master Deployment Script - Beta v1.6
# Deploys both main website and YT subdomain with full cleanup
# ============================================================================

set -e

VERSION="${1:-beta-v1.6}"
SKIP_BUILD="${2:-false}"
SKIP_GIT="${3:-false}"

echo "============================================================================"
echo "  Master Deployment - $VERSION"
echo "============================================================================"
echo ""

# Configuration
VPS_IP="172.86.90.232"
VPS_USER="root"
MAIN_PATH="/var/www/retakt"
YT_PATH="/var/www/yt-downloader"
CF_ZONE_ID="${CLOUDFLARE_ZONE_ID}"
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# ============================================================================
# Step 1: Clean old deployment files
# ============================================================================
echo "▶ Cleaning old deployment files..."

OLD_FILES=(
    "main-dist.tar.gz"
    "yt-dist.tar.gz"
    "ADMIN_GUIDE.md"
    "ADMIN_INTEGRATION_COMPLETE.md"
    "ADMIN_PANEL_EXPLAINED.md"
    "COBALT_SOLUTION.md"
    "COOKIE_SOLUTION.md"
    "DEPLOYMENT_COMPLETE.md"
    "DEPLOYMENT_SUCCESS.md"
    "DEPLOYMENT_SUCCESS_FINAL.md"
    "DEPLOYMENT_UPDATE.md"
    "DEPLOY_README.md"
    "EXPORT_COOKIES_GUIDE.md"
    "FINAL_DEPLOYMENT.md"
    "FINAL_SOLUTION.md"
    "GET_PO_TOKEN.md"
    "MAIN_ADMIN_INTEGRATION.md"
    "MAIN_WEBSITE_INTEGRATION_SETUP.md"
    "OPTIMIZATION_ROADMAP.md"
    "PERFORMANCE_IMPROVEMENTS.md"
    "PRODUCTION_COMPLETE.md"
    "PRODUCTION_README.md"
    "QUICK_START.md"
    "SESSION_MANAGEMENT_DEPLOYED.md"
    "STATUS_MONITORING_EXPLAINED.md"
    "TEST_DOWNLOAD_MANAGER.md"
    "TOKEN_UPDATE_QUICK_GUIDE.md"
    "UI_IMPROVEMENTS_TODO.md"
    "YOUTUBE_BLOCKING_ISSUE.md"
)

for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✓ Deleted $file"
    fi
done

echo "✓ Cleanup complete"
echo ""

# ============================================================================
# Step 2: Build Main Website
# ============================================================================
if [ "$SKIP_BUILD" != "true" ]; then
    echo "▶ Building main website..."
    npm run build
    echo "✓ Main website built"
    echo ""
fi

# ============================================================================
# Step 3: Build YT Subdomain
# ============================================================================
if [ "$SKIP_BUILD" != "true" ]; then
    echo "▶ Building YT subdomain..."
    cd yt
    npm run build
    cd ..
    echo "✓ YT subdomain built"
    echo ""
fi

# ============================================================================
# Step 4: Create deployment archives
# ============================================================================
echo "▶ Creating deployment archives..."

tar -czf main-dist.tar.gz -C dist .
echo "  ✓ main-dist.tar.gz created"

tar -czf yt-dist.tar.gz -C yt/dist .
echo "  ✓ yt-dist.tar.gz created"

echo "✓ Archives created"
echo ""

# ============================================================================
# Step 5: Deploy Main Website
# ============================================================================
echo "▶ Deploying main website to VPS..."

scp main-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    cd /tmp
    rm -rf /var/www/retakt/*
    tar -xzf main-dist.tar.gz -C /var/www/retakt
    rm main-dist.tar.gz
    echo 'Main website deployed'
EOF

echo "✓ Main website deployed"
echo ""

# ============================================================================
# Step 6: Deploy YT Subdomain
# ============================================================================
echo "▶ Deploying YT subdomain to VPS..."

scp yt-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    cd /tmp
    rm -rf /var/www/yt-downloader/frontend/*
    mkdir -p /var/www/yt-downloader/frontend
    tar -xzf yt-dist.tar.gz -C /var/www/yt-downloader/frontend
    rm yt-dist.tar.gz
    echo 'YT subdomain deployed'
EOF

echo "✓ YT subdomain deployed"
echo ""

# ============================================================================
# Step 7: Deploy Backend
# ============================================================================
echo "▶ Deploying backend..."

# Create backend archive (excluding sensitive files and large directories)
tar -czf backend.tar.gz \
    --exclude='node_modules' \
    --exclude='downloads' \
    --exclude='logs' \
    --exclude='.env' \
    --exclude='youtube_cookies.txt' \
    --exclude='wgcf-account.toml' \
    -C yt/backend .

echo "  ✓ backend.tar.gz created"

# Upload and extract backend
scp backend.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    cd /tmp
    mkdir -p /var/www/yt-downloader/backend
    tar -xzf backend.tar.gz -C /var/www/yt-downloader/backend
    rm backend.tar.gz
    cd /var/www/yt-downloader/backend
    docker-compose build
    docker-compose up -d
    echo 'Backend deployed and restarted'
EOF

# Cleanup local archive
rm backend.tar.gz

echo "✓ Backend deployed"
echo ""

# ============================================================================
# Step 8: Purge Cloudflare Cache
# ============================================================================
echo "▶ Purging Cloudflare cache..."

if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' \
        -s | grep -q '"success":true' && echo "✓ Cloudflare cache purged" || echo "⚠ Cloudflare cache purge failed"
else
    echo "⚠ Cloudflare credentials not set, skipping cache purge"
fi
echo ""

# ============================================================================
# Git operations removed - handle manually
# ============================================================================

# ============================================================================
# Deployment Complete
# ============================================================================
echo "============================================================================"
echo "  Deployment Complete! - $VERSION"
echo "============================================================================"
echo ""
echo "  Main Site:    https://retakt.cc"
echo "  YT Subdomain: https://yt.retakt.cc"
echo "  Admin Panel:  https://retakt.cc/admin/api-config"
echo ""
echo "  Backend API:  https://yt.retakt.cc/api/health"
echo "  Admin API:    https://yt.retakt.cc/api/admin/status"
echo ""
