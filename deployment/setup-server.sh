#!/bin/bash
# Server Setup Script - One-time VPS initialization
# Run this first on a fresh Ubuntu 24.04 server

set -e

echo "=========================================="
echo "Server Setup - Contabo VPS"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root"
    exit 1
fi

# Update system
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "[2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "Docker installed: $(docker --version)"
else
    echo "Docker already installed: $(docker --version)"
fi

# Install Docker Compose
echo "[3/8] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed: $(docker-compose --version)"
else
    echo "Docker Compose already installed: $(docker-compose --version)"
fi

# Install Node.js 20
echo "[4/8] Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "Node.js installed: $(node --version)"
    echo "npm installed: $(npm --version)"
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PM2
echo "[5/8] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2@latest
    pm2 startup systemd -u root --hp /root
    echo "PM2 installed: $(pm2 --version)"
else
    echo "PM2 already installed: $(pm2 --version)"
fi

# Install Caddy
echo "[6/8] Installing Caddy..."
if ! command -v caddy &> /dev/null; then
    apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
    systemctl enable caddy
    echo "Caddy installed: $(caddy version | head -1)"
else
    echo "Caddy already installed: $(caddy version | head -1)"
fi

# Create directory structure
echo "[7/8] Creating directory structure..."
mkdir -p /opt/retakt/{frontend,status-api,terminal,logs}
mkdir -p /opt/retakt/status-api/logs
mkdir -p /opt/retakt/terminal/logs
mkdir -p /opt/yt-downloader/{frontend,api,worker,downloads,secrets,docker}
mkdir -p /opt/yt-downloader/api/{src,logs}
mkdir -p /opt/yt-downloader/worker/{src,logs}
mkdir -p /var/log/caddy

# Set permissions
chown -R root:root /opt/retakt
chown -R root:root /opt/yt-downloader
chmod 755 /opt/retakt /opt/yt-downloader
chmod 700 /opt/yt-downloader/secrets

echo "[8/8] Installing system utilities..."
apt install -y htop curl wget git vim nano ufw

# Configure firewall
echo "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw reload

echo "=========================================="
echo "Server setup complete!"
echo "=========================================="
echo ""
echo "Installed software:"
echo "  - Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "  - Docker Compose: $(docker-compose --version | cut -d' ' -f4 | tr -d ',')"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - PM2: $(pm2 --version)"
echo "  - Caddy: $(caddy version | head -1 | cut -d' ' -f1)"
echo ""
echo "Directory structure created:"
echo "  /opt/retakt/"
echo "  /opt/yt-downloader/"
echo ""
echo "Next steps:"
echo "1. Copy secrets to /opt/yt-downloader/secrets/"
echo "2. Upload docker-compose.infrastructure.yml to /opt/yt-downloader/docker/"
echo "3. Upload ecosystem.config.js to /opt/"
echo "4. Upload Caddyfile to /etc/caddy/"
echo "5. Run deploy.sh from your local machine"
