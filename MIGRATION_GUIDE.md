# VPS Migration Guide - Cloudzy to Contabo

## Overview
Migrating from old VPS (172.86.90.232) to new Contabo VPS (157.173.127.84)

## Services to Migrate
1. Main website (retakt.cc) - React static build
2. YT subdomain (yt.retakt.cc) - React static build
3. YT backend - Docker Compose stack:
   - Redis (BullMQ queue)
   - Gluetun (Cloudflare WARP tunnel)
   - API server (Express on port 3000)
   - Worker (BullMQ download worker)
4. Status API - Express service on port 3001

## Prerequisites
- SSH access to new VPS (root@157.173.127.84)
- DNS not yet pointed to new VPS (test first)
- Environment files and secrets backed up

## Step 1: Setup New VPS

SSH into new VPS:
```bash
ssh root@157.173.127.84
```

Upload and run setup script:
```bash
# From local machine
scp setup-vps.sh root@157.173.127.84:/root/
ssh root@157.173.127.84 'bash /root/setup-vps.sh'
```

This installs: Docker, Docker Compose, Node.js, PM2, Caddy

## Step 2: Copy Secrets from Old VPS

From old VPS, backup these files:
```bash
# On old VPS
cd /var/www/yt-downloader/backend
tar -czf secrets.tar.gz .env youtube_cookies.txt wgcf-account.toml
scp secrets.tar.gz root@157.173.127.84:/tmp/
```

On new VPS, extract:
```bash
# On new VPS
mkdir -p /var/www/yt-downloader/backend
cd /var/www/yt-downloader/backend
tar -xzf /tmp/secrets.tar.gz
rm /tmp/secrets.tar.gz
```

Also copy status-api .env if it exists:
```bash
# On old VPS
cd /var/www/retakt/status-api
scp .env root@157.173.127.84:/var/www/retakt/status-api/ || echo "No .env file"
```

## Step 3: Configure Caddy

On new VPS:
```bash
# Backup default Caddyfile
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Upload new Caddyfile from local machine
scp Caddyfile.new-vps root@157.173.127.84:/etc/caddy/Caddyfile

# Test and reload
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## Step 4: Deploy Application

From local machine:
```bash
chmod +x deploy-minimal.sh
./deploy-minimal.sh
```

This will:
1. Build both frontends
2. Upload to new VPS
3. Start Docker backend
4. Start status API with PM2

## Step 5: Verify Services

On new VPS, check everything is running:
```bash
# Check Docker containers
docker ps

# Expected containers:
# - yt-api (healthy)
# - yt-worker (may show unhealthy initially, that's normal)
# - yt-redis (healthy)
# - yt-gluetun (healthy)

# Check PM2
pm2 list

# Expected:
# - status-api (online)

# Check Caddy
systemctl status caddy

# Test endpoints
curl http://localhost:3000/api/health  # YT backend
curl http://localhost:3001/api/status  # Status API
```

## Step 6: Test via IP (Before DNS Change)

Add to your local /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows):
```
157.173.127.84 retakt.cc
157.173.127.84 yt.retakt.cc
```

Then test in browser:
- https://retakt.cc
- https://yt.retakt.cc
- https://yt.retakt.cc/api/health

## Step 7: Update DNS

Once verified working, update DNS A records:
- retakt.cc → 157.173.127.84
- www.retakt.cc → 157.173.127.84
- yt.retakt.cc → 157.173.127.84

Wait 5-30 minutes for propagation.

## Step 8: Purge Cloudflare Cache

If using Cloudflare:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Troubleshooting

### Docker containers not starting
```bash
cd /var/www/yt-downloader/backend
docker-compose logs
```

### PM2 status API not running
```bash
pm2 logs status-api
```

### Caddy errors
```bash
journalctl -u caddy -f
```

### Worker showing unhealthy
This is normal if no downloads are active. Check logs:
```bash
docker logs yt-worker
```

## Rollback Plan

If issues occur, point DNS back to old VPS (172.86.90.232) immediately.

## Post-Migration

1. Monitor logs for 24 hours
2. Keep old VPS running for 1 week as backup
3. Cancel old VPS subscription after confirming stability
