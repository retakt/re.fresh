# Services

Persistent background services for retakt.cc.
These run independently of frontend/backend deployments.

## Services

| Name | What it does | Source on server |
|------|-------------|-----------------|
| `status-api` | Health/status API for the dashboard | `/opt/retakt/status-api/` |
| `terminal-server` | WebSocket terminal (shell.retakt.cc) | `/opt/retakt/terminal/` |
| `yt-api` | YouTube downloader API (yt.retakt.cc) | `/opt/yt-downloader/api/` |
| `yt-worker` | BullMQ job processor for downloads | `/opt/yt-downloader/api/` |
| `ollama-warmup` | Keeps Ollama model hot (no cold start) | `/opt/retakt/backend/services/` |

## Master Env

All services read from `/opt/.env` on the server.
Local copy: `../.env` (root of workspace, gitignored).

## Usage

```bash
cd /opt/services

# Start all
pm2 start ecosystem.config.js

# Start one
pm2 start ecosystem.config.js --only ollama-warmup

# Restart one
pm2 restart ollama-warmup

# Logs
pm2 logs                        # all
pm2 logs yt-worker --lines 50   # specific

# Disk monitor
bash /opt/services/disk-monitor.sh
bash /opt/services/disk-monitor.sh --watch

# Save & auto-start on boot
pm2 save && pm2 startup
```

## Logs

All logs → `/opt/services/logs/`

```
logs/
├── status-api-out.log / status-api-error.log
├── terminal-out.log / terminal-error.log
├── yt-api-out.log / yt-api-error.log
├── yt-worker-out.log / yt-worker-error.log
├── ollama-warmup-out.log / ollama-warmup-error.log
```

## Deploying Changes

```bash
# From local machine
bash deploy-services.sh

# Restart a single service after change
ssh root@157.173.127.84 'pm2 restart ollama-warmup'
```
