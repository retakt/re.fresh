const express = require('express');
const http = require('http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const downloadRoutes = require('./routes/download');
const adminRoutes = require('./routes/admin');
const storageRoutes = require('./routes/storage');
const { initWebSocketServer } = require('./websocket/progress');
const { startCleanupSchedule } = require('./services/cleanup');
const { getCookiePool } = require('./services/cookie-pool');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind Caddy)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  next();
});

// Health check endpoint (before rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: config.nodeEnv,
  });
});

// Admin routes (before rate limiting)
app.use('/api/admin', adminRoutes);

// Storage management routes
app.use('/api/storage', storageRoutes);

// Rate limiting - TEMPORARILY DISABLED FOR DEBUGGING
// const limiter = rateLimit({
//   windowMs: config.rateLimitWindow,
//   max: config.rateLimitMax,
//   message: {
//     error: 'Too many requests',
//     code: 'RATE_LIMIT_EXCEEDED',
//     message: 'Please try again later',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => req.path.startsWith('/admin'),
// });

// app.use('/api/', limiter);

// Download routes (after rate limiting)
app.use('/api', downloadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Start cleanup schedule
startCleanupSchedule();

// Initialize cookie pool
(async () => {
  try {
    const cookiePool = getCookiePool();
    await cookiePool.initialize();
    logger.info('Cookie pool initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize cookie pool', { error: error.message });
  }
})();

// Start server
server.listen(config.port, config.host, () => {
  logger.info('Server started', {
    port: config.port,
    host: config.host,
    environment: config.nodeEnv,
    maxConcurrentDownloads: config.maxConcurrentDownloads,
    jobTimeout: config.jobTimeout,
    fileRetentionHours: config.fileRetentionHours,
  });
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

module.exports = { app, server };
