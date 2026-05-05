#!/bin/bash
# ============================================================================
# Clean Deployment Script (No MCP Server)
# Deploys to VPS without starting local MCP server
# ============================================================================

set -e

VERSION="${1:-beta-v1.7}"
SKIP_BUILD="${2:-false}"

echo "============================================================================"
echo "  Clean Deployment - $VERSION"
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
    "backend.tar.gz"
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
else
    echo "▶ Skipping build (using existing dist)"
    echo ""
fi

# ============================================================================
# Step 3: Build YT Subdomain (if exists)
# ============================================================================
if [ -d "yt" ] && [ "$SKIP_BUILD" != "true" ]; then
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

# Main website
tar -czf main-dist.tar.gz -C dist .
echo "  ✓ main-dist.tar.gz created ($(du -h main-dist.tar.gz | cut -f1))"

# YT subdomain (if exists)
if [ -d "yt/dist" ]; then
    tar -czf yt-dist.tar.gz -C yt/dist .
    echo "  ✓ yt-dist.tar.gz created ($(du -h yt-dist.tar.gz | cut -f1))"
fi

# Backend (if exists)
if [ -d "yt/backend" ]; then
    tar -czf backend.tar.gz \
        --exclude='node_modules' \
        --exclude='downloads' \
        --exclude='logs' \
        --exclude='.env' \
        --exclude='youtube_cookies.txt' \
        --exclude='wgcf-account.toml' \
        -C yt/backend .
    echo "  ✓ backend.tar.gz created ($(du -h backend.tar.gz | cut -f1))"
fi

# MCP server files
echo "  ▶ Creating MCP server archive..."
tar -czf mcp-server.tar.gz -C mcp-server .
echo "  ✓ mcp-server.tar.gz created ($(du -h mcp-server.tar.gz | cut -f1))"

echo "✓ Archives created"
echo ""

# ============================================================================
# Step 5: Deploy Main Website to VPS
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
# Step 6: Deploy YT Subdomain (if exists)
# ============================================================================
if [ -f "yt-dist.tar.gz" ]; then
    echo "▶ Deploying YT subdomain to VPS..."
    
    scp yt-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
    ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
        cd /tmp
        rm -rf /var/www/yt-downloader/dist/*
        mkdir -p /var/www/yt-downloader/dist
        tar -xzf yt-dist.tar.gz -C /var/www/yt-downloader/dist
        rm yt-dist.tar.gz
        echo 'YT subdomain deployed'
EOF
    
    echo "✓ YT subdomain deployed"
    echo ""
fi

# ============================================================================
# Step 7: Deploy Backend (if exists)
# ============================================================================
if [ -f "backend.tar.gz" ]; then
    echo "▶ Deploying backend..."
    
    scp backend.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
    ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
        cd /tmp
        mkdir -p /var/www/yt-downloader/backend
        tar -xzf backend.tar.gz -C /var/www/yt-downloader/backend
        rm backend.tar.gz
        cd /var/www/yt-downloader/backend
        
        # Restart backend services
        if [ -f "docker-compose.yml" ]; then
            docker-compose build
            docker-compose up -d
            echo 'Backend deployed and restarted'
        else
            echo 'No docker-compose.yml found, skipping backend restart'
        fi
EOF
    
    echo "✓ Backend deployed"
    echo ""
fi

# ============================================================================
# Step 8: Deploy MCP Server to VPS
# ============================================================================
echo "▶ Deploying MCP server to VPS..."

scp mcp-server.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    cd /tmp
    mkdir -p /var/www/mcp-server
    tar -xzf mcp-server.tar.gz -C /var/www/mcp-server
    rm mcp-server.tar.gz
    
    # Install dependencies
    cd /var/www/mcp-server
    npm install
    
    echo 'MCP server files deployed'
    echo 'To start MCP server on VPS, run:'
    echo '  cd /var/www/mcp-server && node ai-status-api.js'
EOF

echo "✓ MCP server deployed"
echo ""

# ============================================================================
# Step 9: Purge Cloudflare Cache
# ============================================================================
echo "▶ Purging Cloudflare cache..."

if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
    PURGE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}')
    
    if echo "$PURGE_RESULT" | grep -q '"success":true'; then
        echo "✓ Cloudflare cache purged successfully"
    else
        echo "⚠ Cloudflare cache purge failed"
        echo "  Response: $PURGE_RESULT"
    fi
else
    echo "⚠ Cloudflare credentials not set, skipping cache purge"
    echo "  Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables"
fi
echo ""

# ============================================================================
# Step 10: Cleanup local archives
# ============================================================================
echo "▶ Cleaning up local archives..."

rm -f main-dist.tar.gz yt-dist.tar.gz backend.tar.gz mcp-server.tar.gz
echo "✓ Local archives cleaned"
echo ""

# ============================================================================
# Deployment Complete
# ============================================================================
echo "============================================================================"
echo "  Deployment Complete! - $VERSION"
echo "============================================================================"
echo ""
echo "  🚀 Services:"
echo "  ├─ Main Site:     https://retakt.cc"
if [ -d "yt" ]; then
    echo "  ├─ YT Subdomain:  https://yt.retakt.cc"
    echo "  ├─ Backend API:   https://yt.retakt.cc/api/health"
    echo "  └─ Admin API:     https://yt.retakt.cc/api/admin/status"
else
    echo "  └─ Admin Panel:   https://retakt.cc/admin"
fi
echo ""
echo "  📁 VPS Files:"
echo "  ├─ Main Site:     /var/www/retakt/"
echo "  ├─ YT Site:       /var/www/yt-downloader/dist/"
echo "  ├─ Backend:       /var/www/yt-downloader/backend/"
echo "  └─ MCP Server:    /var/www/mcp-server/"
echo ""
echo "  🔧 Next Steps:"
echo "  1. SSH into VPS: ssh root@172.86.90.232"
echo "  2. Start MCP server: cd /var/www/mcp-server && node ai-status-api.js"
echo "  3. Test admin panel: https://retakt.cc/admin"
echo ""