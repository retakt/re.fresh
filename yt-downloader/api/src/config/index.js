require('dotenv').config();

module.exports = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  },

  // Downloads
  downloadDir: process.env.DOWNLOAD_DIR || './downloads',
  maxFileSize: process.env.MAX_FILE_SIZE || '2G',
  fileRetentionHours: parseInt(process.env.FILE_RETENTION_HOURS, 10) || 1,
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS, 10) || 3,

  // Jobs
  jobTimeout: parseInt(process.env.JOB_TIMEOUT_MS, 10) || 300000, // 5 minutes
  jobMaxRetries: parseInt(process.env.JOB_MAX_RETRIES, 10) || 2,

  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
