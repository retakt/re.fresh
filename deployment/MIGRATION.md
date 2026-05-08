# Production Migration Guide

## Overview
Migrating from Cloudzy VPS (1GB RAM) to Contabo VPS (12GB RAM) with proper architecture.

## New Architecture Benefits
- **Docker**: Only for Redis + Gluetun (infrastructure)
- **PM2**: All Node.js services (better performance, easier debugging)
- **Separated**: Clean directory structure, isolated logs
- **Scalable**: 9.8GB RAM free for future services

## Pre-Migration Checklist

### On Old VPS
1. Backup all secrets:
```bash
ssh root@172.86.90.232
cd /var/www/yt-downloader/backend
tar -czf secrets-backup.tar.gz .env youtube_cookies.txt wgcf-account.toml
scp secrets-backup.tar.gz root@157.173.127.84:/tmp/
```

2. Backup any custom configs or data

3. Document current environment variables

### On Local Machine
1. Update DNS records (but don't activate yet):
   - retakt.cc A → 157.173.127.84 (set TTL to 300)
   - www.retakt.cc A → 157.173.127.84
   - yt.retakt.cc A → 157.173.127.84

2. Have Cloudflare API credentials ready for cache purge

## Migration Steps

### Step 1: Initial Server Setup

SSH into new VPS:
```bash
ssh root@157.173.127.84
```

Upload and run setup script:
```bash
# From local machine
cd deployment
scp setup-server.sh root@157.173.127.84:/root/
ssh root@157.173.127.84 'bash /root/setup-server.sh'
```

This installs: Docker, Node.js, PM2, Caddy, creates directory structure.

### Step 2: Copy Secrets

On new VPS:
```bash
cd /opt/yt-downloader/secrets
tar -xzf /tmp/secrets-backup.tar.gz
chmod 600 *
rm /tmp/secrets-backup.tar.gz
```

Verify secrets are present:
```bash
ls -la /opt/yt-downloader/secrets/
# Should show: .env, youtube_cookies.txt, wgcf-account.toml
```

### Step 3: Upload Configuration Files

From local machine:
```bash
cd deployment

# Upload Docker Compose config
scp docker-compose.infrastructure.yml root@157.173.127.84:/opt/yt-downloader/docker/

# Upload PM2 ecosystem config
scp ecosystem.config.js root@157.173.127.84:/opt/

# Upload Caddyfile
scp Caddyfile root@157.173.127.84:/etc/caddy/

# Verify Caddyfile syntax
ssh root@157.173.127.84 'caddy validate --config /etc/caddy/Caddyfile'
```

### Step 4: Start Infrastructure Services

On new VPS:
```bash
cd /opt/yt-downloader/docker
docker-compose -f docker-compose.infrastructure.yml up -d

# Verify containers are running
docker ps

# Expected output:
# retakt-redis (healthy)
# retakt-gluetun (healthy)
```

Check logs if any issues:
```bash
docker-compose -f docker-compose.infrastructure.yml logs
```

### Step 5: Deploy Application

From local machine:
```bash
cd deployment
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Build both frontends
2. Upload to VPS
3. Install dependencies
4. Start PM2 services
5. Reload Caddy

### Step 6: Verify Services

On new VPS:
```bash
# Check PM2 services
pm2 list

# Expected:
# yt-api (online)
# yt-worker (online)
# status-api (online)

# Check Docker
docker ps

# Check Caddy
systemctl status caddy

# Test endpoints
curl http://localhost:3000/api/health  # YT API
curl http://localhost:3001/api/status  # Status API
curl http://localhost:6379  # Redis (should connect)
```

Check PM2 logs:
```bash
pm2 logs --lines 50
```

### Step 7: Test via IP (Before DNS)

On your local machine, edit hosts file:

**Linux/Mac**: `/etc/hosts`
**Windows**: `C:\Windows\System32\drivers\etc\hosts`

Add:
```
157.173.127.84 retakt.cc
157.173.127.84 yt.retakt.cc
```

Test in browser:
- https://retakt.cc (should load main site)
- https://yt.retakt.cc (should load YT downloader)
- https://yt.retakt.cc/api/health (should return {"status":"ok"})

Try a download to verify worker is functioning.

### Step 8: Switch DNS

Once verified working:

1. Activate DNS changes (set to new IP)
2. Wait 5-10 minutes for propagation
3. Remove hosts file entries
4. Test from multiple locations

### Step 9: Purge Cloudflare Cache

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Step 10: Monitor

Keep old VPS running for 24 hours as backup. Monitor new VPS:

```bash
# Watch PM2 logs
pm2 logs

# Watch Docker logs
docker-compose -f /opt/yt-downloader/docker/docker-compose.infrastructure.yml logs -f

# Watch Caddy logs
tail -f /var/log/caddy/*.log

# System resources
htop
```

## Useful Commands

### PM2 Management
```bash
pm2 list                    # List all services
pm2 logs                    # View all logs
pm2 logs yt-api             # View specific service
pm2 restart yt-api          # Restart service
pm2 reload all              # Reload all services
pm2 monit                   # Real-time monitoring
```

### Docker Management
```bash
cd /opt/yt-downloader/docker
docker-compose -f docker-compose.infrastructure.yml ps       # List containers
docker-compose -f docker-compose.infrastructure.yml logs     # View logs
docker-compose -f docker-compose.infrastructure.yml restart  # Restart all
docker-compose -f docker-compose.infrastructure.yml down     # Stop all
docker-compose -f docker-compose.infrastructure.yml up -d    # Start all
```

### Caddy Management
```bash
systemctl status caddy      # Check status
systemctl reload caddy      # Reload config
systemctl restart caddy     # Restart service
caddy validate --config /etc/caddy/Caddyfile  # Validate config
journalctl -u caddy -f      # View logs
```

## Troubleshooting

### PM2 service won't start
```bash
pm2 logs <service-name>
# Check for missing dependencies or env vars
```

### Docker container unhealthy
```bash
docker logs <container-name>
docker inspect <container-name>
```

### Caddy SSL issues
```bash
journalctl -u caddy -n 100
# Check DNS is pointing to new IP
# Verify ports 80/443 are open
```

### Worker not downloading
```bash
pm2 logs yt-worker
# Check Gluetun is healthy
docker logs retakt-gluetun
# Verify cookies file exists
ls -la /opt/yt-downloader/secrets/youtube_cookies.txt
```

## Rollback Plan

If critical issues occur:

1. Point DNS back to old VPS (172.86.90.232)
2. Purge Cloudflare cache
3. Wait for DNS propagation
4. Debug new VPS without affecting users

## Post-Migration

1. Monitor for 48 hours
2. Keep old VPS for 1 week as backup
3. Document any issues encountered
4. Update deployment documentation
5. Cancel old VPS subscription after confirming stability

## Future Enhancements

With 9.8GB RAM available, consider:
- PostgreSQL for local database
- Redis cache for main site (separate instance)
- Monitoring stack (Prometheus + Grafana)
- Additional worker instances for parallel downloads
- Development/staging environment
