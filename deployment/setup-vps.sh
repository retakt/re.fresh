#!/bin/bash
# VPS setup script for Contabo server
# Installs: Docker, Node.js, PM2, Caddy

set -e

echo "=========================================="
echo "VPS Setup Script"
echo "=========================================="

# Update system
echo "[1/6] Updating system..."
apt update && apt upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "[3/6] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# Install Node.js
echo "[4/6] Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js already installed"
fi

# Install PM2
echo "[5/6] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
else
    echo "PM2 already installed"
fi

# Install Caddy
echo "[6/6] Installing Caddy..."
if ! command -v caddy &> /dev/null; then
    apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
else
    echo "Caddy already installed"
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p /var/www/retakt
mkdir -p /var/www/yt-downloader/dist
mkdir -p /var/www/yt-downloader/backend

echo "=========================================="
echo "VPS setup complete"
echo "Installed:"
echo "  - Docker $(docker --version | cut -d' ' -f3)"
echo "  - Docker Compose $(docker-compose --version | cut -d' ' -f4)"
echo "  - Node.js $(node --version)"
echo "  - PM2 $(pm2 --version)"
echo "  - Caddy $(caddy version | head -1)"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy .env files and secrets to the VPS"
echo "2. Configure Caddyfile at /etc/caddy/Caddyfile"
echo "3. Run deploy-minimal.sh from your local machine"
