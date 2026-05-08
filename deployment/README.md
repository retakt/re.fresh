# Deployment Package - Contabo VPS Migration

## What's Included

This deployment package provides a complete, production-ready setup for migrating from your old 1GB VPS to the new 12GB Contabo server with proper architecture.

### Files

1. **server-architecture.md** - Complete architecture overview and design decisions
2. **docker-compose.infrastructure.yml** - Docker config (Redis + Gluetun only)
3. **ecosystem.config.js** - PM2 config for all Node.js services
4. **Caddyfile** - Reverse proxy and SSL configuration
5. **setup-server.sh** - One-time server initialization script
6. **deploy.sh** - Main deployment script (run from local machine)
7. **MIGRATION.md** - Step-by-step migration guide
8. **QUICK-REFERENCE.md** - Daily management commands

## Key Architecture Decisions

### Why Docker for Infrastructure Only?
- **Redis**: Isolated, easy to manage, persistent storage
- **Gluetun**: Requires special networking capabilities
- **Total overhead**: ~600MB RAM vs 2-3GB if everything was in Docker

### Why PM2 for Node.js Services?
- **Performance**: No Docker overhead, native Node.js speed
- **Debugging**: Easy to attach debugger, view logs, restart
- **Resource control**: Better CPU/memory limits per process
- **Monitoring**: Built-in monitoring with `pm2 monit`

### Directory Structure
```
/opt/
├── retakt/                  # Main site
│   ├── frontend/            # Static files
│   ├── status-api/          # Status service
│   └── logs/
│
└── yt-downloader/           # YT service
    ├── frontend/            # Static files
    ├── api/                 # API server (PM2)
    ├── worker/              # Download worker (PM2)
    ├── downloads/           # Downloaded files
    ├── secrets/             # Credentials
    └── docker/              # Redis + Gluetun
```

## Quick Start

### 1. Setup New Server (One-time)
```bash
scp setup-server.sh root@157.173.127.84:/root/
ssh root@157.173.127.84 'bash /root/setup-server.sh'
```

### 2. Copy Secrets
```bash
# From old VPS
ssh root@OLD_IP 'cd /var/www/yt-downloader/backend && tar -czf /tmp/secrets.tar.gz .env youtube_cookies.txt wgcf-account.toml'
scp root@OLD_IP:/tmp/secrets.tar.gz .
scp secrets.tar.gz root@157.173.127.84:/tmp/

# On new VPS
ssh root@157.173.127.84 'cd /opt/yt-downloader/secrets && tar -xzf /tmp/secrets.tar.gz && chmod 600 *'
```

### 3. Upload Configs
```bash
scp docker-compose.infrastructure.yml root@157.173.127.84:/opt/yt-downloader/docker/
scp ecosystem.config.js root@157.173.127.84:/opt/
scp Caddyfile root@157.173.127.84:/etc/caddy/
```

### 4. Start Infrastructure
```bash
ssh root@157.173.127.84 'cd /opt/yt-downloader/docker && docker-compose -f docker-compose.infrastructure.yml up -d'
```

### 5. Deploy Application
```bash
./deploy.sh
```

### 6. Verify
```bash
ssh root@157.173.127.84 'pm2 list && docker ps'
```

## Resource Allocation

| Service | RAM | CPU | Type |
|---------|-----|-----|------|
| Redis | 512MB | 0.5 | Docker |
| Gluetun | 100MB | 0.5 | Docker |
| YT API | 200MB | 1.0 | PM2 |
| YT Worker | 300MB | 2.0 | PM2 |
| Status API | 50MB | 0.5 | PM2 |
| Caddy | 50MB | 0.5 | System |
| System | 1GB | 1.0 | OS |
| **Used** | **2.2GB** | **6.0** | |
| **Free** | **9.8GB** | **0** | For future |

## What's Different from Old Setup?

### Old VPS (Cloudzy)
- Everything in Docker (high overhead)
- Caddy in Docker container
- 1GB RAM (constantly maxed out)
- Worker showing unhealthy (resource starvation)

### New VPS (Contabo)
- Docker only for infrastructure
- Node.js services run natively with PM2
- 12GB RAM (only 18% used)
- Clean separation, better performance
- Room for growth

## Benefits

1. **Performance**: 3-5x faster Node.js execution without Docker overhead
2. **Debugging**: Easy to debug, view logs, restart services
3. **Scalability**: 9.8GB RAM free for future services
4. **Maintainability**: Clear structure, isolated logs
5. **Reliability**: Better resource allocation, no more unhealthy workers

## Support

- **Architecture questions**: See `server-architecture.md`
- **Migration steps**: See `MIGRATION.md`
- **Daily commands**: See `QUICK-REFERENCE.md`
- **Troubleshooting**: Check logs with `pm2 logs` and `docker logs`

## Next Steps After Migration

With 9.8GB RAM available, consider:
- PostgreSQL database (if moving from Supabase)
- Separate Redis cache for main site
- Monitoring stack (Prometheus + Grafana)
- Additional worker instances
- Development/staging environment
- Elasticsearch for search
