// PM2 Ecosystem Configuration
// Manages all Node.js services

module.exports = {
  apps: [
    // YT Downloader API Server
    {
      name: 'yt-api',
      cwd: '/opt/yt-downloader/api',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379
      },
      error_file: '/opt/yt-downloader/api/logs/error.log',
      out_file: '/opt/yt-downloader/api/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // YT Downloader Worker
    {
      name: 'yt-worker',
      cwd: '/opt/yt-downloader/api',
      script: 'src/queue/worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: 6379,
        DOWNLOADS_PATH: '/opt/yt-downloader/downloads',
        COOKIES_PATH: '/opt/yt-downloader/secrets/youtube_cookies.txt',
        GLUETUN_PROXY: 'socks5://172.18.0.3:1080'  // Gluetun container IP
      },
      error_file: '/opt/yt-downloader/api/logs/worker-error.log',
      out_file: '/opt/yt-downloader/api/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // Status API
    {
      name: 'status-api',
      cwd: '/opt/retakt/status-api',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/retakt/status-api/logs/error.log',
      out_file: '/opt/retakt/status-api/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },

    // Terminal Server
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
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
