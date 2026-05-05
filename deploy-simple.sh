#!/bin/bash
# ============================================================================
# Simple Deployment Script
# Just deploys the built files to VPS
# ============================================================================

set -e

VERSION="${1:-beta-v1.7}"
SKIP_BUILD="${2:-false}"

echo "============================================================================"
echo "  Simple Deployment - $VERSION"
echo "============================================================================"
echo ""

# Configuration
VPS_IP="172.86.90.232"
VPS_USER="root"
CF_ZONE_ID="${CLOUDFLARE_ZONE_ID}"
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# ============================================================================
# Step 1: Clean old files
# ============================================================================
echo "▶ Cleaning old deployment files..."
rm -f main-dist.tar.gz yt-dist.tar.gz backend.tar.gz
echo "✓ Cleanup complete"
echo ""

# ============================================================================
# Step 2: Build (if not skipped)
# ============================================================================
if [ "$SKIP_BUILD" != "true" ]; then
    echo "▶ Building main website..."
    npm run build
    echo "✓ Main website built"
    echo ""
    
    if [ -d "yt" ]; then
        echo "▶ Building YT subdomain..."
        cd yt && npm run build && cd ..
        echo "✓ YT subdomain built"
        echo ""
    fi
fi

# ============================================================================
# Step 3: Create archives
# ============================================================================
echo "▶ Creating deployment archives..."

tar -czf main-dist.tar.gz -C dist .
echo "  ✓ main-dist.tar.gz created"

if [ -d "yt/dist" ]; then
    tar -czf yt-dist.tar.gz -C yt/dist .
    echo "  ✓ yt-dist.tar.gz created"
fi

if [ -d "yt/backend" ]; then
    tar -czf backend.tar.gz \
        --exclude='node_modules' \
        --exclude='downloads' \
        --exclude='logs' \
        --exclude='.env' \
        -C yt/backend .
    echo "  ✓ backend.tar.gz created"
fi

echo "✓ Archives created"
echo ""

# ============================================================================
# Step 4: Deploy to VPS
# ============================================================================
echo "▶ Deploying to VPS..."

# Main website
scp main-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    cd /tmp
    rm -rf /var/www/retakt/*
    tar -xzf main-dist.tar.gz -C /var/www/retakt
    rm main-dist.tar.gz
    echo 'Main website deployed'
EOF

# YT subdomain
if [ -f "yt-dist.tar.gz" ]; then
    scp yt-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
    ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
        cd /tmp
        rm -rf /var/www/yt-downloader/dist/*
        mkdir -p /var/www/yt-downloader/dist
        tar -xzf yt-dist.tar.gz -C /var/www/yt-downloader/dist
        rm yt-dist.tar.gz
        echo 'YT subdomain deployed'
EOF
fi

# Backend
if [ -f "backend.tar.gz" ]; then
    scp backend.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
    ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
        cd /tmp
        mkdir -p /var/www/yt-downloader/backend
        tar -xzf backend.tar.gz -C /var/www/yt-downloader/backend
        rm backend.tar.gz
        cd /var/www/yt-downloader/backend
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d
        fi
        echo 'Backend deployed'
EOF
fi

echo "✓ Deployment complete"
echo ""

# ============================================================================
# Step 5: Purge Cloudflare Cache
# ============================================================================
echo "▶ Purging Cloudflare cache..."

if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' > /dev/null
    echo "✓ Cloudflare cache purged"
else
    echo "⚠ Cloudflare credentials not set"
fi
echo ""

# ============================================================================
# Cleanup
# ============================================================================
echo "▶ Cleaning up..."
rm -f main-dist.tar.gz yt-dist.tar.gz backend.tar.gz
echo "✓ Local files cleaned"
echo ""

# ============================================================================
# Complete
# ============================================================================
echo "============================================================================"
echo "  Deployment Complete! - $VERSION"
echo "============================================================================"
echo ""
echo "  🚀 Live Sites:"
echo "  ├─ Main Site:     https://retakt.cc"
echo "  ├─ YT Subdomain:  https://yt.retakt.cc"
echo "  └─ Admin Panel:   https://retakt.cc/admin"
echo ""
echo "  📝 Next Steps:"
echo "  1. SSH into VPS: ssh root@172.86.90.232"
echo "  2. Copy MCP files manually if needed"
echo "  3. Test admin terminal: https://retakt.cc/admin"
echo ""