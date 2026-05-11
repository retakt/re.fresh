#!/bin/bash
set -euo pipefail
trap 'echo "FAILED at line $LINENO" >&2; cleanup' ERR

# ============================================================================
# deploy.sh — retakt.cc unified deployment
#
# Usage:
#   bash deploy.sh              # deploy everything
#   bash deploy.sh frontend     # frontend only
#   bash deploy.sh backend      # yt-api + yt-worker + status-api + terminal
#   bash deploy.sh services     # PM2 ecosystem + warmup service only
#   bash deploy.sh yt           # yt-api + yt-worker only
#
# Requires: ssh access to SERVER, node/npm locally
# ============================================================================

SERVER="root@157.173.127.84"
TARGET="${1:-all}"

# Temp archives created during this run — cleaned up on exit or error
ARCHIVES=()

cleanup() {
  for f in "${ARCHIVES[@]:-}"; do
    [ -f "$f" ] && rm -f "$f"
  done
}
trap cleanup EXIT

# ── Helpers ───────────────────────────────────────────────────────────────────

pack() {
  local name="$1"; shift
  tar -czf "${name}.tar.gz" "$@"
  ARCHIVES+=("${name}.tar.gz")
}

upload() {
  local name="$1"
  scp "${name}.tar.gz" "$SERVER:/tmp/"
}

remote() {
  ssh "$SERVER" bash -s <<< "$1"
}

# ── Targets ───────────────────────────────────────────────────────────────────

deploy_frontend() {
  echo "--- frontend"

  cd retakt/frontend
  npm install --silent
  npm run build --silent
  cd ../..

  pack frontend-build -C retakt/frontend/dist .
  upload frontend-build

  remote '
    rm -rf /opt/retakt/frontend/*
    mkdir -p /opt/retakt/frontend
    tar -xzf /tmp/frontend-build.tar.gz -C /opt/retakt/frontend
    rm /tmp/frontend-build.tar.gz
  '

  echo "    frontend deployed"
}

deploy_status_api() {
  echo "--- status-api"

  pack status-api \
    --exclude="node_modules" \
    --exclude="*.log" \
    -C retakt/status-api .

  upload status-api

  remote '
    mkdir -p /opt/retakt/status-api
    tar -xzf /tmp/status-api.tar.gz -C /opt/retakt/status-api
    rm /tmp/status-api.tar.gz
    cd /opt/retakt/status-api
    npm install --production --silent
    pm2 restart status-api 2>/dev/null || true
  '

  echo "    status-api deployed"
}

deploy_terminal() {
  echo "--- terminal-server"

  pack terminal-server \
    --exclude="node_modules" \
    --exclude="*.log" \
    --exclude="*.pid" \
    -C retakt/terminal .

  upload terminal-server

  # Deploy root .env.local for terminal password
  if [ -f ".env.local" ]; then
    scp ".env.local" "$SERVER:/tmp/retakt-env-local"
  fi

  remote '
    mkdir -p /opt/retakt/terminal
    tar -xzf /tmp/terminal-server.tar.gz -C /opt/retakt/terminal
    rm /tmp/terminal-server.tar.gz

    # Deploy env if uploaded
    if [ -f /tmp/retakt-env-local ]; then
      mkdir -p /opt/retakt
      mv /tmp/retakt-env-local /opt/retakt/.env.local
      chmod 600 /opt/retakt/.env.local
    fi

    # Make scripts executable
    find /opt/retakt/terminal/scripts -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

    pm2 restart terminal-server 2>/dev/null || true
  '

  echo "    terminal-server deployed"
}

deploy_yt() {
  echo "--- yt-api + yt-worker + yt-frontend"

  # Build yt-downloader frontend
  echo "    building yt-frontend..."
  cd yt-downloader/frontend
  npm install --silent
  npm run build --silent
  cd ../..

  # Pack yt-frontend
  pack yt-frontend -C yt-downloader/frontend/dist .

  # Pack yt-api (source + docker files)
  pack yt-api \
    --exclude="node_modules" \
    --exclude="downloads/*" \
    --exclude="logs/*" \
    --exclude="*.log" \
    -C yt-downloader/api .

  upload yt-frontend
  upload yt-api

  # Upload master .env for token values
  if [ -f ".env" ]; then
    scp ".env" "$SERVER:/tmp/yt-master-env"
  fi

  remote '
    # Deploy yt-frontend — Caddy serves from /opt/yt-downloader/frontend
    mkdir -p /opt/yt-downloader/frontend
    rm -rf /opt/yt-downloader/frontend/*
    tar -xzf /tmp/yt-frontend.tar.gz -C /opt/yt-downloader/frontend
    rm /tmp/yt-frontend.tar.gz
    echo "    yt-frontend files deployed to /opt/yt-downloader/frontend"

    # Deploy yt-api source
    mkdir -p /opt/yt-downloader/api
    mkdir -p /opt/yt-downloads
    tar -xzf /tmp/yt-api.tar.gz -C /opt/yt-downloader/api
    rm /tmp/yt-api.tar.gz

    # Write .env for docker-compose
    if [ -f /tmp/yt-master-env ]; then
      source /tmp/yt-master-env 2>/dev/null || true
      rm /tmp/yt-master-env
    fi

    cat > /opt/yt-downloader/api/.env << ENVEOF
YT_ADMIN_TOKEN=${YT_ADMIN_TOKEN:-re.takt}
ENVEOF

    # Rebuild and restart Docker containers
    cd /opt/yt-downloader/api
    docker compose down 2>/dev/null || true
    docker compose build --no-cache
    docker compose up -d
    echo "    yt-api + yt-worker Docker containers started"
  '

  echo "    yt-frontend + yt-api + yt-worker deployed"
}

deploy_services() {
  echo "--- services (PM2 ecosystem + warmup)"

  pack services \
    --exclude="logs" \
    --exclude="README.md" \
    -C services .

  pack warmup-service \
    -C retakt/backend/services \
    warmup-service.js

  upload services
  upload warmup-service

  # Upload master env
  if [ -f ".env" ]; then
    scp ".env" "$SERVER:/tmp/master-env"
  fi

  remote '
    mkdir -p /opt/services/logs
    mkdir -p /opt/retakt/backend/services

    tar -xzf /tmp/services.tar.gz -C /opt/services
    chmod +x /opt/services/disk-monitor.sh
    rm /tmp/services.tar.gz

    tar -xzf /tmp/warmup-service.tar.gz -C /opt/retakt/backend/services
    rm /tmp/warmup-service.tar.gz

    if [ -f /tmp/master-env ]; then
      mv /tmp/master-env /opt/.env
      chmod 600 /opt/.env
    fi

    # Reload PM2 from master config
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    pm2 start /opt/services/ecosystem.config.js
    pm2 save
  '

  echo "    services deployed"
}

# ── Docker services (Redis + Gluetun) ─────────────────────────────────────────

restart_docker() {
  echo "--- docker (redis + gluetun)"

  remote '
    if command -v docker &>/dev/null; then
      docker ps --filter "name=retakt-redis" --filter "name=retakt-gluetun" --format "{{.Names}}" | while read name; do
        docker restart "$name" && echo "    restarted $name"
      done
    fi
  '
}

# ── Cloudflare cache purge ────────────────────────────────────────────────────

purge_cache() {
  if [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "--- cloudflare cache purge"
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}' \
      | grep -q '"success":true' && echo "    cache purged" || echo "    cache purge failed"
  fi
}

# ── PM2 status ────────────────────────────────────────────────────────────────

show_status() {
  echo "--- pm2 status"
  ssh "$SERVER" 'pm2 status'
  echo "--- docker status"
  ssh "$SERVER" 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=retakt-yt"'
}

# ── Entry point ───────────────────────────────────────────────────────────────

case "$TARGET" in
  all)
    deploy_frontend
    deploy_status_api
    deploy_terminal
    deploy_yt
    deploy_services
    purge_cache
    show_status
    ;;
  frontend)
    deploy_frontend
    purge_cache
    ;;
  backend)
    deploy_status_api
    deploy_terminal
    deploy_yt
    show_status
    ;;
  services)
    deploy_services
    show_status
    ;;
  yt)
    deploy_yt
    show_status
    ;;
  docker)
    restart_docker
    ;;
  status)
    show_status
    ;;
  *)
    echo "unknown target: $TARGET"
    echo "usage: bash deploy.sh [all|frontend|backend|services|yt|docker|status]"
    exit 1
    ;;
esac

echo ""
echo "done"
