# Server Architecture - Contabo VPS

## System Specs
- CPU: 6 cores (AMD EPYC)
- RAM: 12GB
- Disk: 100GB NVMe
- OS: Ubuntu 24.04

## Directory Structure

```
/opt/
├── retakt/                          # Main application root
│   ├── frontend/                    # Main website static files
│   ├── status-api/                  # Status monitoring API
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── .env
│   │   └── logs/
│   └── logs/                        # Centralized logs
│
├── yt-downloader/                   # YouTube downloader service
│   ├── frontend/                    # YT subdomain static files
│   ├── api/                         # Express API server
│   │   ├── src/
│   │   ├── package.json
│   │   ├── .env
│   │   └── logs/
│   ├── worker/                      # BullMQ worker
│   │   ├── src/
│   │   ├── package.json
│   │   └── logs/
│   ├── downloads/                   # Downloaded files
│   ├── secrets/                     # Credentials
│   │   ├── youtube_cookies.txt
│   │   └── wgcf-account.toml
│   └── docker/                      # Docker-only services
│       └── docker-compose.yml       # Redis + Gluetun only
│
└── docker/                          # Global Docker configs
    └── networks/                    # Shared networks

/etc/
├── caddy/
│   └── Caddyfile                    # Reverse proxy config
│
└── systemd/system/
    ├── yt-api.service               # YT API systemd service
    ├── yt-worker.service            # YT Worker systemd service
    └── retakt-status.service        # Status API systemd service
```

## Service Breakdown

### Docker Services (Isolated Infrastructure)
1. **Redis** - BullMQ queue backend
   - Port: 6379 (internal only)
   - Memory limit: 512MB
   - Persistent storage

2. **Gluetun** - Cloudflare WARP VPN tunnel
   - Required for YouTube downloads
   - Worker connects through this

### System Services (PM2/Systemd)
1. **YT API Server**
   - Port: 3000
   - Process manager: PM2
   - Connects to: Redis (Docker)
   - Resources: ~200MB RAM, 1 CPU core

2. **YT Worker**
   - No exposed port
   - Process manager: PM2
   - Connects to: Redis (Docker), Gluetun (Docker network)
   - Resources: ~300MB RAM, 2 CPU cores (for downloads)

3. **Status API**
   - Port: 3001
   - Process manager: PM2
   - Resources: ~50MB RAM, 0.5 CPU core

### Static Files (Caddy)
1. **Main Website** - /opt/retakt/frontend
2. **YT Subdomain** - /opt/yt-downloader/frontend

## Resource Allocation

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| Redis | 512MB | 0.5 | Docker |
| Gluetun | 100MB | 0.5 | Docker |
| YT API | 200MB | 1.0 | PM2 |
| YT Worker | 300MB | 2.0 | PM2 (spikes during downloads) |
| Status API | 50MB | 0.5 | PM2 |
| Caddy | 50MB | 0.5 | System |
| System | 1GB | 1.0 | OS overhead |
| **Total Used** | **~2.2GB** | **6.0** | |
| **Available** | **~9.8GB** | **0** | For future services |

## Network Flow

```
Internet
    ↓
Caddy (443/80)
    ↓
    ├─→ /opt/retakt/frontend (static)
    ├─→ /api/status/* → Status API :3001
    │
    └─→ yt.retakt.cc
        ├─→ /opt/yt-downloader/frontend (static)
        └─→ /api/* → YT API :3000
                        ↓
                    Redis (Docker)
                        ↓
                    YT Worker (PM2)
                        ↓
                    Gluetun (Docker) → YouTube
```

## Advantages of This Architecture

1. **Performance**
   - Node.js services run natively (no Docker overhead)
   - Direct access to filesystem for downloads
   - Faster startup and restart times

2. **Debugging**
   - PM2 provides excellent logs and monitoring
   - Easy to attach debugger to Node processes
   - Clear separation of concerns

3. **Resource Management**
   - PM2 can limit CPU/memory per process
   - Docker limits only infrastructure services
   - 9.8GB RAM free for future expansion

4. **Scalability**
   - Easy to add more workers
   - Can add more services without Docker bloat
   - Room for databases, caching, etc.

5. **Maintenance**
   - Update Node services without rebuilding Docker images
   - Restart individual services without affecting others
   - Clear log locations per service

## Future Expansion Ideas (9.8GB RAM available)

- PostgreSQL database (if moving away from Supabase)
- Redis cache for main site (separate from BullMQ)
- Elasticsearch for search
- Additional worker processes
- Development/staging environments
- Monitoring stack (Prometheus + Grafana)
