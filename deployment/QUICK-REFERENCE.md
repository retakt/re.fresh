# Quick Reference - Server Management

## Service Architecture

```
/opt/retakt/
├── frontend/          → Main website (Caddy serves)
└── status-api/        → Status API (PM2: port 3001)

/opt/yt-downloader/
├── frontend/          → YT subdomain (Caddy serves)
├── api/               → YT API (PM2: port 3000)
├── worker/            → Download worker (PM2)
├── downloads/         → Downloaded files
├── secrets/           → Credentials
└── docker/            → Redis + Gluetun (Docker)
```

## Quick Commands

### Check Everything
```bash
pm2 list                                    # Node.js services
docker ps                                   # Docker containers
systemctl status caddy                      # Web server
```

### View Logs
```bash
pm2 logs                                    # All PM2 logs
pm2 logs yt-api                             # Specific service
docker logs retakt-redis                    # Docker logs
tail -f /var/log/caddy/retakt.log           # Caddy logs
```

### Restart Services
```bash
pm2 restart yt-api                          # Restart API
pm2 restart yt-worker                       # Restart worker
pm2 reload all                              # Reload all PM2 services
systemctl reload caddy                      # Reload Caddy
docker-compose -f /opt/yt-downloader/docker/docker-compose.infrastructure.yml restart
```

### Deploy Updates
```bash
# From local machine
cd deployment
./deploy.sh
```

### System Resources
```bash
htop                                        # Interactive monitor
pm2 monit                                   # PM2 monitoring
docker stats                                # Docker stats
df -h                                       # Disk usage
free -h                                     # Memory usage
```

## Service Ports

| Service | Port | Access |
|---------|------|--------|
| Caddy | 80, 443 | Public |
| YT API | 3000 | Localhost only |
| Status API | 3001 | Localhost only |
| Redis | 6379 | Localhost only |
| Gluetun | - | Internal |

## URLs

- Main site: https://retakt.cc
- YT subdomain: https://yt.retakt.cc
- YT API health: https://yt.retakt.cc/api/health
- Status API: https://retakt.cc/api/status

## Emergency Procedures

### Service Down
```bash
pm2 restart <service-name>
pm2 logs <service-name>
```

### High Memory Usage
```bash
pm2 restart all
docker-compose -f /opt/yt-downloader/docker/docker-compose.infrastructure.yml restart
```

### Disk Full
```bash
# Clean old downloads
rm -rf /opt/yt-downloader/downloads/*

# Clean Docker
docker system prune -a

# Clean logs
pm2 flush
```

### SSL Certificate Issues
```bash
systemctl restart caddy
journalctl -u caddy -n 50
```

## File Locations

### Logs
- PM2: `/opt/*/logs/`
- Caddy: `/var/log/caddy/`
- Docker: `docker logs <container>`

### Configs
- PM2: `/opt/ecosystem.config.js`
- Caddy: `/etc/caddy/Caddyfile`
- Docker: `/opt/yt-downloader/docker/docker-compose.infrastructure.yml`

### Secrets
- `/opt/yt-downloader/secrets/.env`
- `/opt/yt-downloader/secrets/youtube_cookies.txt`
- `/opt/yt-downloader/secrets/wgcf-account.toml`

## Health Checks

```bash
# Quick health check script
curl -s http://localhost:3000/api/health && echo "✓ YT API OK" || echo "✗ YT API DOWN"
curl -s http://localhost:3001/api/status && echo "✓ Status API OK" || echo "✗ Status API DOWN"
docker exec retakt-redis redis-cli ping && echo "✓ Redis OK" || echo "✗ Redis DOWN"
```

## Backup Commands

```bash
# Backup secrets
tar -czf secrets-$(date +%Y%m%d).tar.gz /opt/yt-downloader/secrets/

# Backup configs
tar -czf configs-$(date +%Y%m%d).tar.gz /opt/ecosystem.config.js /etc/caddy/Caddyfile /opt/yt-downloader/docker/

# Backup Redis data
docker exec retakt-redis redis-cli SAVE
cp /var/lib/docker/volumes/retakt-redis-data/_data/dump.rdb ~/redis-backup-$(date +%Y%m%d).rdb
```
