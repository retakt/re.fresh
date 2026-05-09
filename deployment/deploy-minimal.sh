#!/bin/bash
# Minimal deployment script for Contabo VPS migration
# Deploys: Main site, YT subdomain, YT backend (Docker), Status API

set -e

# Configuration
VPS_IP="157.173.127.84"
VPS_USER="root"
VERSION="${1:-$(date +%Y%m%d-%H%M)}"

echo "=========================================="
echo "Deployment started: $VERSION"
echo "Target: $VPS_USER@$VPS_IP"
echo "=========================================="

# Build main site
echo "[1/7] Building main site..."
npm run build

# Build YT subdomain
echo "[2/7] Building YT subdomain..."
cd yt && npm run build && cd ..

# Create archives
echo "[3/7] Creating deployment archives..."
tar -czf main-dist.tar.gz -C dist .
tar -czf yt-dist.tar.gz -C yt/dist .
tar -czf backend.tar.gz --exclude='node_modules' --exclude='downloads' --exclude='logs' -C yt/backend .
tar -czf status-api.tar.gz --exclude='node_modules' --exclude='logs' -C status-api .

# Deploy main site
echo "[4/7] Deploying main site..."
scp main-dist.tar.gz "$VPS_USER@$VPS_IP:/tmp/"
ssh "$VPS_USER@$VPS_IP" "mkdir -p /var/www/retakt && rm -rf /var/www/retakt/* && tar -xzf /tmp/main-dist.tar.gz -C /var/www/retakt && rm /tmp/main-dist.tar.gz"

# Deploy YT frontend
echo "[5/7] Deploying YT subdomain..."
scp yt-dist.tar.gz "$VPS_USER@$VPS_IP:/tmp/"
ssh "$VPS_USER@$VPS_IP" "mkdir -p /var/www/yt-downloader/dist && rm -rf /var/www/yt-downloader/dist/* && tar -xzf /tmp/yt-dist.tar.gz -C /var/www/yt-downloader/dist && rm /tmp/yt-dist.tar.gz"

# Deploy backend
echo "[6/7] Deploying YT backend..."
scp backend.tar.gz "$VPS_USER@$VPS_IP:/tmp/"
ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
    mkdir -p /var/www/yt-downloader/backend
    cd /var/www/yt-downloader/backend
    tar -xzf /tmp/backend.tar.gz
    rm /tmp/backend.tar.gz
    docker-compose down || true
    docker-compose build
    docker-compose up -d
ENDSSH

# Deploy status API
echo "[7/7] Deploying status API..."
scp status-api.tar.gz "$VPS_USER@$VPS_IP:/tmp/"
ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
    mkdir -p /var/www/retakt/status-api
    cd /var/www/retakt/status-api
    tar -xzf /tmp/status-api.tar.gz
    rm /tmp/status-api.tar.gz
    npm install --production
    pm2 delete status-api || true
    pm2 start server.js --name status-api
    pm2 save
ENDSSH

# Cleanup local archives
rm -f main-dist.tar.gz yt-dist.tar.gz backend.tar.gz status-api.tar.gz

echo "=========================================="
echo "Deployment complete: $VERSION"
echo "Main site: https://retakt.cc"
echo "YT subdomain: https://yt.retakt.cc"
echo "=========================================="
