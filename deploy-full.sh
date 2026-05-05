#!/bin/bash
# ============================================================================
# Full Deployment Script with MCP Server (FIXED - Cross Platform)
# ============================================================================

set -e

VERSION="${1:-beta-v1.7}"
SKIP_BUILD="${2:-false}"
PORT=3002

echo "============================================================================"
echo "  Full Deployment with MCP Server - $VERSION"
echo "============================================================================"
echo ""

# Ensure logs dir exists
mkdir -p logs

# ----------------------------------------------------------------------------
# Kill port (robust, Windows-safe)
# ----------------------------------------------------------------------------
kill_port() {
    echo "▶ Cleaning port $PORT..."

    # Windows-safe approach (works in Git Bash)
    PIDS=$(cmd.exe /c "netstat -ano | findstr :$PORT" 2>/dev/null | awk '{print $5}' | tr -d '\r')

    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            if [ "$PID" != "0" ]; then
                echo "  → Killing PID $PID"
                cmd.exe /c "taskkill /PID $PID /F" >/dev/null 2>&1 || true
            fi
        done
        sleep 2
    else
        echo "  → Port already free"
    fi
}

# ----------------------------------------------------------------------------
# Check if port is running (NO grep = no hanging)
# ----------------------------------------------------------------------------
is_port_running() {
    cmd.exe /c "netstat -ano | findstr :$PORT" > /dev/null 2>&1
}

# =====================================================================
# Step 1: Prepare MCP Server
# =====================================================================
echo "▶ Preparing MCP Server..."

kill_port

cd mcp-server

if [ ! -d "node_modules" ]; then
    echo "▶ Installing dependencies..."
    npm install
fi

echo "▶ Starting MCP API server on port $PORT..."

nohup node ai-status-api.js > ../logs/mcp-server.log 2>&1 &
MCP_PID=$!
echo $MCP_PID > ../logs/mcp-server.pid

sleep 3

# =====================================================================
# Step 2: Verify startup
# =====================================================================
if is_port_running; then
    echo "✓ MCP Server started (PID: $MCP_PID)"
else
    echo "✗ MCP Server failed to start"
    echo ""
    echo "Last logs:"
    tail -n 20 ../logs/mcp-server.log
    exit 1
fi

cd ..

echo ""

# =====================================================================
# Step 3: Health check
# =====================================================================
echo "▶ Verifying MCP Server..."

if curl -s http://localhost:$PORT/status > /dev/null 2>&1; then
    echo "✓ MCP Server responding"
    echo ""
    echo "Preview:"
    curl -s http://localhost:$PORT/status | head -n 5
else
    echo "✗ MCP Server not responding"
    echo ""
    echo "Logs:"
    tail -n 20 logs/mcp-server.log
    exit 1
fi

echo ""
echo "============================================================================"
echo "  MCP Server Ready — Continue Deployment"
echo "============================================================================"
echo ""
# (Continue your VPS deploy steps below...)
# Configuration
VPS_IP="172.86.90.232"
VPS_USER="root"
MAIN_PATH="/var/www/retakt"
YT_PATH="/var/www/yt-downloader"
CF_ZONE_ID="${CLOUDFLARE_ZONE_ID}"
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN}"


# ============================================================================
# Step 3: Clean old deployment files
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
# Step 4: Build Main Website
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
# Step 5: Build YT Subdomain (if exists)
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
# Step 6: Create deployment archives
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

echo "✓ Archives created"
echo ""

# ============================================================================
# Step 7: Deploy Main Website to VPS
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
# Step 8: Deploy YT Subdomain (if exists)
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
# Step 9: Deploy Backend (if exists)
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
# Step 10: Purge Cloudflare Cache
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
# Step 11: Cleanup local archives
# ============================================================================
echo "▶ Cleaning up local archives..."

rm -f main-dist.tar.gz yt-dist.tar.gz backend.tar.gz
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
echo "  🔧 Local Services:"
echo "  └─ MCP Server:    http://localhost:3002/status"
echo ""
echo "  📝 Logs:"
echo "  └─ MCP Server:    logs/mcp-server.log"
echo ""
echo "  💡 Tips:"
echo "  - Check MCP status: curl http://localhost:3002/status"
echo "  - Stop MCP server: kill \$(cat logs/mcp-server.pid)"
echo "  - View MCP logs:   tail -f logs/mcp-server.log"
echo ""
