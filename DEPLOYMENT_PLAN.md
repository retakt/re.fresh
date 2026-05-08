# Complete Deployment Plan - New VPS Migration

## Current Status
- ✅ Gluetun: Fixed and running (IPv6 disabled)
- ✅ Redis: Running and healthy
- ⏳ PM2 Services: Not deployed yet
- ⏳ Frontends: Not deployed yet
- ⏳ Caddy: Not configured yet

## Services Overview

### 1. Main Website (retakt.cc)
- **Frontend**: React SPA (built with Vite)
- **Location**: `/opt/retakt/frontend/`
- **Build**: `npm run build` → `dist/`
- **Served by**: Caddy

### 2. YT Downloader (yt.retakt.cc)
- **Frontend**: React SPA
- **Location**: `/opt/yt-downloader/frontend/`
- **Build**: `cd yt && npm run build` → `yt/dist/`
- **Served by**: Caddy
- **Backend API**: Express + BullMQ
  - Location: `/opt/yt-downloader/api/`
  - Port: 3000
  - Managed by: PM2
- **Worker**: BullMQ download worker
  - Location: `/opt/yt-downloader/api/` (same codebase)
  - Managed by: PM2

### 3. Status API
- **Type**: Express API
- **Location**: `/opt/retakt/status-api/`
- **Port**: 3001
- **Managed by**: PM2
- **Purpose**: Monitor AI services status

### 4. Terminal Server
- **Type**: WebSocket + PTY server
- **Location**: `terminal/` (in project root)
- **Port**: 3003
- **Managed by**: PM2 (needs to be added)
- **Purpose**: Shared live terminal for admin

### 5. Infrastructure (Docker)
- **Redis**: BullMQ queue backend (port 6379)
- **Gluetun**: VPN tunnel for downloads

### 6. Supabase
- **Type**: External service (hosted)
- **URL**: https://yroedxnorqfndcajlmpu.supabase.co
- **Purpose**: Authentication, database, storage
- **Migration needed**: `supabase-migration-terminal-key.sql`

## Missing from Deployment

### 1. Terminal Server Not in PM2 Config
The `ecosystem.config.js` doesn't include the terminal server. Need to add:
```javascript
{
  name: 'terminal-server',
  cwd: '/opt/retakt/terminal',
  script: 'server.js',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  watch: false,
  max_memory_restart: '100M',
  env: {
    NODE_ENV: 'production',
    TERMINAL_PORT: 3003,
    TERMINAL_PASSWORD: 'takt7',
    TERMINAL_CORS_ORIGIN: '*'
  },
  error_file: '/opt/retakt/terminal/logs/error.log',
  out_file: '/opt/retakt/terminal/logs/out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true
}
```

### 2. Caddy Configuration for Terminal
Need to add to Caddyfile:
```
shell.retakt.cc {
    reverse_proxy localhost:3003 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
    
    # WebSocket support
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket localhost:3003
}
```

### 3. Deploy Script Doesn't Include Terminal
The `deployment/deploy.sh` doesn't deploy the terminal server.

## Deployment Steps

### Phase 1: Update Configuration Files ✅
1. ✅ Fix Gluetun IPv6 issue
2. ⏳ Add terminal server to ecosystem.config.js
3. ⏳ Add shell.retakt.cc to Caddyfile
4. ⏳ Update deploy.sh to include terminal

### Phase 2: Deploy Infrastructure ✅
1. ✅ Docker Compose (Redis + Gluetun) - DONE

### Phase 3: Deploy Applications
1. Build main frontend
2. Build YT frontend
3. Upload frontends to VPS
4. Upload backend code (YT API, status-api, terminal)
5. Install dependencies on VPS
6. Start PM2 services
7. Configure and reload Caddy

### Phase 4: Verify Services
1. Check Docker containers
2. Check PM2 processes
3. Check Caddy status
4. Test endpoints:
   - https://retakt.cc
   - https://yt.retakt.cc
   - https://yt.retakt.cc/api/health
   - https://retakt.cc/api/status
   - wss://shell.retakt.cc

### Phase 5: Database Migration
1. Run Supabase migration for terminal_key column
2. Verify database schema

## Environment Variables Needed on VPS

### YT Backend (.env in /opt/yt-downloader/secrets/)
- PORT=3000
- REDIS_HOST=127.0.0.1
- REDIS_PORT=6379
- NODE_ENV=production
- DOWNLOADS_PATH=/opt/yt-downloader/downloads
- COOKIES_PATH=/opt/yt-downloader/secrets/youtube_cookies.txt
- GLUETUN_PROXY=socks5://172.18.0.3:1080

### Terminal Server
- TERMINAL_PORT=3003
- TERMINAL_PASSWORD=takt7
- TERMINAL_CORS_ORIGIN=*

### Status API
- PORT=3001
- NODE_ENV=production

## DNS Configuration
- retakt.cc → 157.173.127.84
- www.retakt.cc → 157.173.127.84
- yt.retakt.cc → 157.173.127.84
- shell.retakt.cc → 157.173.127.84 (NEW)

## Security Checklist
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Secrets in /opt/yt-downloader/secrets/ (chmod 600)
- [ ] Terminal password set (TERMINAL_PASSWORD)
- [ ] YT admin token set (VITE_YT_ADMIN_TOKEN)
- [ ] Supabase JWT secret configured
- [ ] All services running as root (for now, consider non-root later)

## Rollback Plan
If deployment fails:
1. Keep old VPS running
2. Point DNS back to old IP
3. Debug new VPS without affecting users
4. Fix issues and retry

## Post-Deployment Tasks
1. Monitor logs for 24 hours
2. Test all features:
   - User authentication
   - YT downloads
   - Terminal access
   - Status monitoring
3. Keep old VPS for 1 week as backup
4. Document any issues
5. Update team documentation

## Resource Usage (Expected)
- Redis: 512MB RAM
- Gluetun: 100MB RAM
- YT API: 200MB RAM
- YT Worker: 300MB RAM
- Status API: 50MB RAM
- Terminal Server: 50MB RAM
- Caddy: 50MB RAM
- System: 1GB RAM
- **Total**: ~2.3GB / 12GB (19% usage)
- **Free**: 9.7GB for future services

## Next Steps
1. Update ecosystem.config.js
2. Update Caddyfile
3. Update deploy.sh
4. Run deployment
5. Verify all services
6. Test functionality
7. Monitor for issues
