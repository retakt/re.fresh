#!/bin/bash
# ============================================================================
# Master Deployment Script - v2.0 (Terminal Enhanced)
# Deploys main website, YT subdomain, status-api, and handles all latest changes
# ============================================================================

set -e

VERSION="${1:-v2.0-terminal-enhanced}"
SKIP_BUILD="${2:-false}"
SKIP_GIT="${3:-false}"

echo "============================================================================"
echo "  Master Deployment - $VERSION"
echo "============================================================================"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_ENV="${REPO_ROOT}/.env.local"

VPS_IP="157.173.127.84"
VPS_USER="root"
VPS_HOST="root@157.173.127.84"   # Direct connection to new VPS
MAIN_PATH="/opt/retakt/frontend"
YT_PATH="/opt/yt-downloader/frontend"
STATUS_API_PATH="/opt/retakt/status-api"
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
    "status-api.tar.gz"
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
    "AI_STATUS_API_PLAN.md"
    "DOCKER_FULL_MOUNT_SETUP.md"
    "DOCKER_SOCKET_GUIDE.md"
    "TERMINAL_AUTH_SETUP.md"
    "STATUS_API_SETUP.md"
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
# Step 2: Build Main Website (with Terminal Enhancements)
# ============================================================================
if [ "$SKIP_BUILD" != "true" ]; then
    echo "▶ Building main website with terminal enhancements..."
    
    # Ensure dependencies are up to date
    npm install
    
    # Build the project
    npm run build
    
    echo "✓ Main website built with latest terminal styling"
    echo ""
fi

# ============================================================================
# Step 3: Build YT Subdomain
# ============================================================================
if [ "$SKIP_BUILD" != "true" ]; then
    echo "▶ Building YT subdomain..."
    cd yt
    npm install
    npm run build
    cd ..
    echo "✓ YT subdomain built"
    echo ""
fi

# ============================================================================
# Step 4: Create deployment archives
# ============================================================================
echo "▶ Creating deployment archives..."

# YT subdomain archive (still uses tar — no rsync needed for static files)
tar -czf yt-dist.tar.gz -C yt/dist .
echo "  ✓ yt-dist.tar.gz created"

# Status API archive
if [ -d "status-api" ]; then
    tar -czf status-api.tar.gz -C status-api .
    echo "  ✓ status-api.tar.gz created"
fi

echo "✓ Archives created"
echo ""

# ============================================================================
# Step 5: Deploy Main Website via rsync
# ============================================================================
echo "▶ Deploying main website to VPS (rsync)..."

# rsync the built dist/ → /opt/retakt/frontend/
# --delete removes files on VPS that no longer exist locally (stale assets)
# Excludes: terminal/ node_modules/ .env.production ecosystem.config.cjs package.json
rsync -az --delete --delete-after \
    --exclude='terminal/' \
    --exclude='node_modules/' \
    --exclude='.env.production' \
    --exclude='ecosystem.config.cjs' \
    --exclude='package.json' \
    --exclude='package-lock.json' \
    --exclude='logs/' \
    dist/ "${VPS_HOST}:/opt/retakt/frontend/"

# Fix permissions on the static files
ssh "${VPS_HOST}" "chown -R www-data:www-data /opt/retakt/frontend/ 2>/dev/null || true"

echo "✓ Main website deployed"
echo ""

# ============================================================================
# Step 6: Deploy Status API
# ============================================================================
if [ -f "status-api.tar.gz" ]; then
    echo "▶ Deploying Status API..."
    
    scp status-api.tar.gz "${VPS_HOST}:/tmp/"
    ssh "${VPS_HOST}" << 'EOF'
        cd /tmp
        
        # Create status-api directory
        mkdir -p /opt/retakt/status-api
        mkdir -p /opt/retakt/logs
        
        # Deploy status API
        tar -xzf status-api.tar.gz -C /opt/retakt/status-api
        rm status-api.tar.gz
        
        # Install dependencies and start API
        cd /opt/retakt/status-api
        npm install --production
        
        # Stop existing API if running
        if [ -f "logs/status-api.pid" ]; then
            kill $(cat logs/status-api.pid) 2>/dev/null || true
            rm -f logs/status-api.pid
        fi
        
        # Start new API instance
        nohup node server.js > logs/status-api.log 2>&1 & echo $! > logs/status-api.pid
        
        # Set proper permissions
        chown -R www-data:www-data /opt/retakt/status-api
        chown -R www-data:www-data /opt/retakt/logs
        chmod -R 755 /opt/retakt/status-api
        chmod -R 755 /opt/retakt/logs
        
        echo 'Status API deployed and started on port 3002'
EOF
    
    echo "✓ Status API deployed"
    echo ""
fi

# ============================================================================
# Step 7: Deploy YT Subdomain
# ============================================================================
echo "▶ Deploying YT subdomain to VPS..."

scp yt-dist.tar.gz "${VPS_HOST}:/tmp/"
ssh "${VPS_HOST}" << 'EOF'
    cd /tmp
    
    # Backup current YT deployment
    if [ -d "/opt/yt-downloader/frontend" ]; then
        cp -r /opt/yt-downloader/frontend /opt/yt-downloader/frontend-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    fi
    
    # Deploy new YT version
    rm -rf /opt/yt-downloader/frontend/*
    mkdir -p /opt/yt-downloader/frontend
    tar -xzf yt-dist.tar.gz -C /opt/yt-downloader/frontend
    rm yt-dist.tar.gz
    
    # Set proper permissions
    chown -R www-data:www-data /opt/yt-downloader/frontend
    chmod -R 755 /opt/yt-downloader/frontend
    
    echo 'YT subdomain deployed'
EOF

echo "✓ YT subdomain deployed"
echo ""

# ============================================================================
# Step 8: Deploy Backend
# ============================================================================
echo "▶ Deploying backend..."

# Create backend archive (excluding sensitive files and large directories)
tar -czf backend.tar.gz \
    --exclude='node_modules' \
    --exclude='downloads' \
    --exclude='logs' \
    --exclude='youtube_cookies.txt' \
    --exclude='wgcf-account.toml' \
    -C yt/backend .

echo "  ✓ backend.tar.gz created"

# Upload and extract backend
scp backend.tar.gz "${VPS_HOST}:/tmp/"
ssh "${VPS_HOST}" << 'EOF'
    cd /tmp
    
    # Backup current backend
    if [ -d "/opt/yt-downloader/api" ]; then
        cp -r /opt/yt-downloader/api /opt/yt-downloader/api-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    fi
    
    # Deploy new backend
    mkdir -p /opt/yt-downloader/api
    tar -xzf backend.tar.gz -C /opt/yt-downloader/api
    rm backend.tar.gz
    
    # Install dependencies and restart PM2
    cd /opt/yt-downloader/api
    npm install --production
    
    # Use PM2 instead of docker-compose for new VPS
    pm2 delete yt-api yt-worker 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    # Set proper permissions
    chown -R www-data:www-data /opt/yt-downloader/api
    
    echo 'Backend deployed and restarted'
EOF

# Cleanup local archive
rm backend.tar.gz

echo "✓ Backend deployed"
echo ""

# ============================================================================
# Step 9: Deploy Terminal Server via rsync
# ============================================================================
echo "▶ Deploying terminal server (rsync)..."

# Ensure the terminal directory exists on VPS
ssh "${VPS_HOST}" "mkdir -p /opt/retakt/terminal/scripts/system /opt/retakt/terminal/scripts/status /opt/retakt/terminal/scripts/ai /opt/retakt/terminal/lib /opt/retakt/terminal/config"

# rsync terminal/ → /opt/retakt/terminal/
# --delete removes stale scripts
# Excludes: node_modules, logs, .env.production (never overwrite production password)
rsync -az --delete \
    --exclude='node_modules/' \
    --exclude='*.log' \
    --exclude='*.pid' \
    --exclude='.env.production' \
    --exclude='ecosystem.config.cjs' \
    terminal/ "${VPS_HOST}:/opt/retakt/terminal/"

echo "  ✓ Terminal files synced"

if [ -f "${ROOT_ENV}" ]; then
    echo "  ✓ Deploying root .env.local to /opt/retakt/.env.local"
    rsync -az "${ROOT_ENV}" "${VPS_HOST}:/tmp/retakt-env-local"
    ssh "${VPS_HOST}" "mkdir -p /opt/retakt && mv /tmp/retakt-env-local /opt/retakt/.env.local && chmod 600 /opt/retakt/.env.local && rm -f /opt/retakt/terminal/.env.local"
else
    echo "  ⚠ .env.local not found locally; skipping root env deployment"
fi

# On VPS: install deps if package.json changed, make scripts executable, restart PM2
ssh "${VPS_HOST}" << 'TERMINAL_EOF'
    set -e

    cd /opt/retakt

    # Ensure package.json exists for ESM support
    if [ ! -f /opt/retakt/terminal/package.json ]; then
        echo '{"name":"retakt-terminal-server","version":"1.0.0","type":"module","main":"server.js"}' \
            > /opt/retakt/terminal/package.json
    fi

    # Ensure ecosystem config exists (preserves .env.production password)
    if [ ! -f /opt/retakt/terminal/ecosystem.config.cjs ]; then
        cat > /opt/retakt/terminal/ecosystem.config.cjs << 'ECOEOF'
module.exports = {
  apps: [{
    name: "terminal-server",
    script: "/opt/retakt/terminal/server.js",
    cwd: "/opt/retakt",
    interpreter: "node",
    env: {
      NODE_ENV: "production",
      TERMINAL_PORT: "3003",
      TERMINAL_PASSWORD: "takt7",
      TERMINAL_CORS_ORIGIN: "https://retakt.cc"
    }
  }]
}
ECOEOF
    fi

    # Install deps if not present
    if [ ! -d /opt/retakt/node_modules/dotenv ]; then
        echo "Installing terminal server dependencies..."
        npm install dotenv express ws node-pty 2>&1 | tail -3
    fi

    # Make all scripts executable
    find /opt/retakt/terminal/scripts -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

    # Restart PM2 to pick up any server.js changes
    if pm2 list | grep -q "terminal-server"; then
        pm2 restart terminal-server
        echo "✓ Terminal server restarted"
    else
        pm2 start /opt/retakt/terminal/ecosystem.config.cjs
        pm2 save
        echo "✓ Terminal server started"
    fi

    sleep 2
    pm2 status terminal-server
TERMINAL_EOF

echo "✓ Terminal server deployed"
echo ""

# ============================================================================
# Step 10: Ensure Caddy config has shell.retakt.cc block
# ============================================================================
echo "▶ Verifying Caddy config for shell.retakt.cc..."

ssh "${VPS_HOST}" << 'CADDY_EOF'
    CADDYFILE="/etc/caddy/Caddyfile"

    if ! grep -q "shell.retakt.cc" "$CADDYFILE" 2>/dev/null; then
        cat >> "$CADDYFILE" << 'CADDY_BLOCK'

# ============================================================================
# shell.retakt.cc - Shared Live Terminal WebSocket
# ============================================================================

shell.retakt.cc {
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    handle @websocket {
        reverse_proxy localhost:3003
    }
    handle /health {
        reverse_proxy localhost:3003
    }
    respond 404
}
CADDY_BLOCK
        echo "✓ shell.retakt.cc block added to Caddyfile"
    else
        echo "✓ shell.retakt.cc already in Caddyfile"
    fi

    # Reload Caddy to pick up any config changes
    systemctl reload caddy && echo "✓ Caddy reloaded"
CADDY_EOF

echo "✓ Caddy configured"
echo ""

# ============================================================================
# Step 11: Purge Cloudflare Cache
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
# Step 12: Health Checks
# ============================================================================
echo "▶ Running health checks..."

echo "  Checking main website..."
curl -s -o /dev/null -w "  ✓ Main site: %{http_code} (%{time_total}s)\n" "https://retakt.cc" || echo "  ⚠ Main site: Failed"

echo "  Checking YT subdomain..."
curl -s -o /dev/null -w "  ✓ YT site: %{http_code} (%{time_total}s)\n" "https://yt.retakt.cc" || echo "  ⚠ YT site: Failed"

echo "  Checking YT API..."
curl -s -o /dev/null -w "  ✓ YT API: %{http_code} (%{time_total}s)\n" "https://yt.retakt.cc/api/health" || echo "  ⚠ YT API: Failed"

echo "  Checking terminal WebSocket server..."
curl -s -o /dev/null -w "  ✓ Terminal WS health: %{http_code} (%{time_total}s)\n" "https://shell.retakt.cc/health" || echo "  ⚠ Terminal WS: Check DNS for shell.retakt.cc"

echo ""

# ============================================================================
# Deployment Complete
# ============================================================================
echo "============================================================================"
echo "  Deployment Complete! - $VERSION"
echo "============================================================================"
echo ""
echo "  🌐 Main Site:     https://retakt.cc"
echo "  📺 YT Subdomain:  https://yt.retakt.cc"
echo "  🔧 Admin Panel:   https://retakt.cc/admin"
echo "  💻 Terminal:      https://retakt.cc/terminal"
echo "  🐚 Shell WS:      wss://shell.retakt.cc"
echo ""
echo "  🔌 Backend API:   https://yt.retakt.cc/api/health"
echo "  📊 Status API:    http://localhost:3002/status (VPS internal)"
echo "  🔍 Admin API:     https://yt.retakt.cc/api/admin/status"
echo ""
echo "  ✨ Deployed via rsync — only changed files transferred"
echo ""
echo "  🚀 Ready for use!"
echo ""

# Cleanup local archives
rm -f yt-dist.tar.gz status-api.tar.gz 2>/dev/null || true
