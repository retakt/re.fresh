#!/bin/bash
# ============================================================================
# disk-monitor.sh
# Colorful disk & download cache status for retakt.cc server
# Usage: bash disk-monitor.sh [--watch]
# ============================================================================

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

DOWNLOAD_DIR="${DOWNLOAD_DIR:-/opt/yt-downloads}"
ADMIN_TOKEN="${ADMIN_TOKEN:-re.takt}"
API_BASE="http://localhost:3000"

# ── Helpers ───────────────────────────────────────────────────────────────────

bar() {
  local percent=$1
  local width=30
  local filled=$(( percent * width / 100 ))
  local empty=$(( width - filled ))
  local color=$GREEN
  [ "$percent" -gt 60 ] && color=$YELLOW
  [ "$percent" -gt 80 ] && color=$RED
  printf "${color}"
  printf '█%.0s' $(seq 1 $filled)
  printf "${DIM}"
  printf '░%.0s' $(seq 1 $empty)
  printf "${RESET}"
}

bytes_human() {
  local bytes=$1
  if   [ "$bytes" -ge 1073741824 ]; then printf "%.1f GB" "$(echo "scale=1; $bytes/1073741824" | bc)"
  elif [ "$bytes" -ge 1048576 ];    then printf "%.1f MB" "$(echo "scale=1; $bytes/1048576" | bc)"
  elif [ "$bytes" -ge 1024 ];       then printf "%.1f KB" "$(echo "scale=1; $bytes/1024" | bc)"
  else printf "%d B" "$bytes"
  fi
}

# ── Main display ──────────────────────────────────────────────────────────────

show_status() {
  clear
  echo ""
  echo -e "${BOLD}${CYAN}  ╔══════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}  ║          retakt.cc  •  Disk & Cache Monitor              ║${RESET}"
  echo -e "${BOLD}${CYAN}  ╚══════════════════════════════════════════════════════════╝${RESET}"
  echo -e "  ${DIM}$(date '+%A, %d %B %Y  %H:%M:%S')${RESET}"
  echo ""

  # ── Server Disk ─────────────────────────────────────────────────────────────
  echo -e "  ${BOLD}${WHITE}SERVER DISK${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"

  while IFS= read -r line; do
    mount=$(echo "$line" | awk '{print $6}')
    total=$(echo "$line" | awk '{print $2}')
    used=$(echo "$line"  | awk '{print $3}')
    free=$(echo "$line"  | awk '{print $4}')
    pct=$(echo "$line"   | awk '{print $5}' | tr -d '%')

    total_h=$(bytes_human $total)
    used_h=$(bytes_human $used)
    free_h=$(bytes_human $free)

    color=$GREEN
    [ "$pct" -gt 60 ] && color=$YELLOW
    [ "$pct" -gt 80 ] && color=$RED

    echo -e "  ${BOLD}$mount${RESET}"
    printf "  "
    bar $pct
    echo -e "  ${color}${pct}%%${RESET}  ${DIM}used: ${RESET}${used_h}  ${DIM}free: ${RESET}${GREEN}${free_h}${RESET}  ${DIM}total: ${RESET}${total_h}"
    echo ""
  done < <(df -B1 --output=source,size,used,avail,pcent,target 2>/dev/null | grep -E '^/dev/' | head -3)

  # ── Download Cache ───────────────────────────────────────────────────────────
  echo -e "  ${BOLD}${WHITE}DOWNLOAD CACHE${RESET}  ${DIM}(${DOWNLOAD_DIR})${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"

  if [ ! -d "$DOWNLOAD_DIR" ]; then
    echo -e "  ${YELLOW}⚠  Directory not found: ${DOWNLOAD_DIR}${RESET}"
    echo ""
  else
    # Total cache size
    cache_bytes=$(du -sb "$DOWNLOAD_DIR" 2>/dev/null | cut -f1)
    cache_h=$(bytes_human ${cache_bytes:-0})
    file_count=$(find "$DOWNLOAD_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)

    echo -e "  ${CYAN}Total cached:${RESET}  ${BOLD}${cache_h}${RESET}  ${DIM}(${file_count} video folders)${RESET}"
    echo ""

    # List each folder
    if [ "$file_count" -gt 0 ]; then
      echo -e "  ${DIM}  VIDEO ID              SIZE      AGE         FILES${RESET}"
      echo -e "  ${DIM}  ──────────────────────────────────────────────────────${RESET}"

      find "$DOWNLOAD_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r dir; do
        vid=$(basename "$dir")
        size_bytes=$(du -sb "$dir" 2>/dev/null | cut -f1)
        size_h=$(bytes_human ${size_bytes:-0})
        mod_epoch=$(stat -c %Y "$dir" 2>/dev/null)
        now_epoch=$(date +%s)
        age_sec=$(( now_epoch - mod_epoch ))
        age_min=$(( age_sec / 60 ))

        if   [ "$age_min" -lt 60 ];   then age_str="${age_min}m ago";   age_color=$GREEN
        elif [ "$age_min" -lt 1440 ]; then age_str="$(( age_min/60 ))h ago"; age_color=$YELLOW
        else                               age_str="$(( age_min/1440 ))d ago"; age_color=$RED
        fi

        inner_count=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | wc -l)
        exts=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | sed 's/.*\.//' | sort -u | tr '\n' ' ')

        printf "  ${CYAN}  %-22s${RESET}  ${BOLD}%-8s${RESET}  ${age_color}%-12s${RESET}  ${DIM}%d file(s) [%s]${RESET}\n" \
          "$vid" "$size_h" "$age_str" "$inner_count" "$exts"
      done
      echo ""
    fi
  fi

  # ── PM2 Services ─────────────────────────────────────────────────────────────
  echo -e "  ${BOLD}${WHITE}PM2 SERVICES${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"

  if command -v pm2 &>/dev/null; then
    pm2 jlist 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data:
    name = p.get('name','?')
    status = p.get('pm2_env',{}).get('status','?')
    mem = p.get('monit',{}).get('memory',0)
    cpu = p.get('monit',{}).get('cpu',0)
    restarts = p.get('pm2_env',{}).get('restart_time',0)
    mem_mb = mem / 1024 / 1024

    status_color = '\033[0;32m' if status == 'online' else '\033[0;31m'
    mem_color = '\033[0;32m' if mem_mb < 200 else '\033[1;33m' if mem_mb < 400 else '\033[0;31m'
    reset = '\033[0m'
    dim = '\033[2m'
    bold = '\033[1m'

    print(f'  {bold}{name:<20}{reset}  {status_color}{status:<8}{reset}  {mem_color}{mem_mb:>6.1f} MB{reset}  {dim}CPU: {cpu}%  restarts: {restarts}{reset}')
" 2>/dev/null || pm2 list
  else
    echo -e "  ${DIM}pm2 not found${RESET}"
  fi

  echo ""

  # ── Quick Actions ─────────────────────────────────────────────────────────────
  echo -e "  ${BOLD}${WHITE}QUICK ACTIONS${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────────${RESET}"
  echo -e "  ${DIM}Clean expired:${RESET}  curl -X DELETE 'http://localhost:3000/api/storage/clean' -H 'x-admin-token: \$ADMIN_TOKEN'"
  echo -e "  ${DIM}Purge all:     ${RESET}  curl -X DELETE 'http://localhost:3000/api/storage/purge' -H 'x-admin-token: \$ADMIN_TOKEN'"
  echo -e "  ${DIM}Status JSON:   ${RESET}  curl 'http://localhost:3000/api/storage/status' -H 'x-admin-token: \$ADMIN_TOKEN'"
  echo -e "  ${DIM}Manual wipe:   ${RESET}  rm -rf ${DOWNLOAD_DIR}/*"
  echo ""
  echo -e "  ${DIM}Last updated: $(date '+%H:%M:%S')  •  Press Ctrl+C to exit${RESET}"
  echo ""
}

# ── Entry point ───────────────────────────────────────────────────────────────

if [ "$1" = "--watch" ]; then
  while true; do
    show_status
    sleep 10
  done
else
  show_status
fi
