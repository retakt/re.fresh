/**
 * PM2 Master Ecosystem Config
 * 
 * Manages all persistent background services for retakt.cc
 * All services read from the master env file: /opt/.env
 * 
 * Usage:
 *   pm2 start ecosystem.config.js          # Start all
 *   pm2 start ecosystem.config.js --only ollama-warmup
 *   pm2 restart ecosystem.config.js        # Restart all
 *   pm2 reload ecosystem.config.js         # Zero-downtime reload
 *   pm2 stop ecosystem.config.js           # Stop all
 *   pm2 save && pm2 startup                # Persist on reboot
 */

const RETAKT  = "/opt/retakt";
const YT      = "/opt/yt-downloader";
const LOGS    = "/opt/services/logs";
const ENV     = "/opt/.env";           // Master env file

module.exports = {
  apps: [

    // ── Status API ──────────────────────────────────────────────────────────
    {
      name: "status-api",
      script: "server.js",
      cwd: `${RETAKT}/status-api`,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env_file: ENV,
      env: { NODE_ENV: "production" },
      error_file: `${LOGS}/status-api-error.log`,
      out_file:   `${LOGS}/status-api-out.log`,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },

    // ── Terminal Server ─────────────────────────────────────────────────────
    {
      name: "terminal-server",
      script: "server.js",
      cwd: `${RETAKT}/terminal`,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env_file: ENV,
      env: { NODE_ENV: "production" },
      error_file: `${LOGS}/terminal-error.log`,
      out_file:   `${LOGS}/terminal-out.log`,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },

    // ── YT API ──────────────────────────────────────────────────────────────
    // Managed by Docker (docker-compose.yml) for WARP routing via gluetun
    // Start with: cd /opt/yt-downloader/api && docker compose up -d
    // {
    //   name: "yt-api",  ← removed from PM2
    // },

    // ── YT Worker ───────────────────────────────────────────────────────────
    // Managed by Docker — network_mode: container:retakt-gluetun for WARP
    // {
    //   name: "yt-worker",  ← removed from PM2
    // },

    // ── Ollama Warmup ───────────────────────────────────────────────────────
    {
      name: "ollama-warmup",
      script: "warmup-service.js",
      cwd: `${RETAKT}/backend/services`,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env_file: ENV,
      env: {
        NODE_ENV: "production",
        OLLAMA_URL: "https://chat-api.retakt.cc",
        MODEL_ID: "joe-speedboat/Gemma-4-Uncensored-HauhauCS-Aggressive:e4b",
      },
      error_file: `${LOGS}/ollama-warmup-error.log`,
      out_file:   `${LOGS}/ollama-warmup-out.log`,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },

  ],
};
