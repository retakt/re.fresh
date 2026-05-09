#!/bin/bash
set -euo pipefail
IFS=$'\n\t'
trap 'echo "❌ Deployment failed at line $LINENO" >&2' ERR

# Deploy backend services to match new directory structure
echo "🚀 Deploying backend services to server..."

SERVER="root@157.173.127.84"

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local local_path=$2
    local remote_path=$3
    
    echo "📦 Deploying $service_name..."
    
    # Create archive excluding node_modules and other unnecessary files
    tar -czf "${service_name}.tar.gz" \
        --exclude="node_modules" \
        --exclude="*.log" \
        --exclude="downloads/*" \
        --exclude="logs/*" \
        --exclude=".git" \
        -C "$local_path" .
    
    # Upload to server
    scp "${service_name}.tar.gz" "$SERVER:/tmp/"
    
    # Extract on server
    ssh "$SERVER" REMOTE_PATH="$remote_path" SERVICE_NAME="$service_name" bash -s << 'EOF'
        set -euo pipefail
        remote_path="$REMOTE_PATH"
        service_name="$SERVICE_NAME"
        # Create directory if it doesn't exist
        mkdir -p "$remote_path"
        
        # Backup existing files (if any)
        if [ -d "$remote_path" ] && [ "$(ls -A "$remote_path")" ]; then
            echo "📋 Backing up existing $service_name..."
            cp -r "$remote_path" "${remote_path}.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # Extract new files
        cd "$remote_path"
        tar -xzf "/tmp/${service_name}.tar.gz"
        rm "/tmp/${service_name}.tar.gz"
        
        # Install dependencies if package.json exists
        if [ -f "package.json" ]; then
            echo "📥 Installing dependencies for $service_name..."
            npm install --production
        fi
        
        echo "✅ $service_name deployed successfully!"
EOF
    
    # Cleanup local archive
    rm "${service_name}.tar.gz"
}

# Deploy Status API
deploy_service "status-api" "retakt/status-api" "/opt/retakt/status-api"

# Deploy Terminal Server
deploy_service "terminal-server" "retakt/terminal" "/opt/retakt/terminal"

# Deploy root .env.local to /opt/retakt/.env.local so the terminal server uses the current password
if [ -f ".env.local" ]; then
    echo "📦 Deploying root .env.local..."
    scp ".env.local" "$SERVER:/tmp/retakt-env-local"
    ssh "$SERVER" << 'EOF'
        mkdir -p /opt/retakt
        mv /tmp/retakt-env-local /opt/retakt/.env.local
        chmod 600 /opt/retakt/.env.local
        rm -f /opt/retakt/terminal/.env.local
        echo "✅ Root .env.local deployed and stale terminal/.env.local removed"
EOF
else
    echo "⚠ Warning: .env.local not found in repo root; skipping root env deployment"
fi

# Deploy YT Downloader API
deploy_service "yt-api" "yt-downloader/api" "/opt/yt-downloader/api"

# Build and deploy YT Frontend
echo "🎨 Building and deploying YT Frontend..."
cd yt-downloader/frontend

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm is not installed locally; cannot build YT Frontend"
    exit 1
fi

# Install dependencies and build
npm install
npm run build

# Deploy YT Frontend
tar -czf yt-frontend.tar.gz -C dist .
scp yt-frontend.tar.gz "$SERVER:/tmp/"

ssh "$SERVER" << 'EOF'
    mkdir -p /opt/yt-downloader/frontend
    cd /opt/yt-downloader/frontend
    rm -rf *
    tar -xzf /tmp/yt-frontend.tar.gz
    rm /tmp/yt-frontend.tar.gz
    echo "✅ YT Frontend deployed!"
EOF

rm yt-frontend.tar.gz
cd ../..

# Restart PM2 services
echo "🔄 Restarting PM2 services..."
ssh "$SERVER" << 'EOF'
    # Restart all services
    pm2 restart all
    
    # Show status
    echo "📊 PM2 Status:"
    pm2 status
    
    echo ""
    echo "🎉 Backend deployment complete!"
    echo "📋 Services deployed:"
    echo "  • Status API: /opt/retakt/status-api"
    echo "  • Terminal Server: /opt/retakt/terminal" 
    echo "  • YT API: /opt/yt-downloader/api"
    echo "  • YT Frontend: /opt/yt-downloader/frontend"
EOF

echo "✨ All backend services deployed successfully!"
echo "🔗 Test URLs:"
echo "  • Main site: https://retakt.cc"
echo "  • YT site: https://yt.retakt.cc"
echo "  • Status API: https://retakt.cc/api/health"
echo "  • YT API: https://yt.retakt.cc/api/health"