const { Worker } = require('bullmq');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { downloadVideo, getVideoInfo, extractVideoId } = require('../services/ytdlp');
const { broadcastProgress } = require('../websocket/progress');
const { getCookiePool } = require('../services/cookie-pool');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Get worker IP and write to shared file
async function updateWorkerIP() {
  try {
    const { stdout } = await execPromise('wget -qO- --timeout=5 https://cloudflare.com/cdn-cgi/trace 2>/dev/null | grep "ip=" | cut -d= -f2');
    const ip = stdout.trim();
    
    if (ip) {
      const ipData = {
        ip,
        connected: true,
        timestamp: new Date().toISOString()
      };
      
      const logsDir = path.join(__dirname, '../../logs');
      await fs.mkdir(logsDir, { recursive: true });
      await fs.writeFile(path.join(logsDir, 'worker-ip.json'), JSON.stringify(ipData, null, 2));
      logger.info('Worker IP updated', { ip });
      return ip;
    }
  } catch (error) {
    logger.error('Failed to get worker IP', { error: error.message });
    
    // Write error state
    const ipData = {
      ip: null,
      connected: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    const logsDir = path.join(__dirname, '../../logs');
    await fs.mkdir(logsDir, { recursive: true }).catch(() => {});
    await fs.writeFile(path.join(logsDir, 'worker-ip.json'), JSON.stringify(ipData, null, 2)).catch(() => {});
  }
  return null;
}

// Update IP on startup
logger.info('Starting worker IP detection...');
updateWorkerIP()
  .then(ip => {
    logger.info('Initial worker IP check complete', { ip });
  })
  .catch(error => {
    logger.error('Initial worker IP check failed', { error: error.message, stack: error.stack });
  });

// Initialize cookie pool
(async () => {
  try {
    const cookiePool = getCookiePool();
    await cookiePool.initialize();
    logger.info('Worker: Cookie pool initialized successfully');
  } catch (error) {
    logger.error('Worker: Failed to initialize cookie pool', { error: error.message });
  }
})();

// Refresh IP every 5 minutes
setInterval(() => {
  updateWorkerIP().catch(error => {
    logger.error('Periodic worker IP update failed', { error: error.message });
  });
}, 5 * 60 * 1000);

/**
 * Process download job
 */
async function processDownloadJob(job) {
  const { url, mode, settings } = job.data;
  const jobId = job.id;
  const startTime = Date.now();

  // RAM snapshot at job start
  const memStart = process.memoryUsage();

  logger.info('Job started', {
    jobId,
    url,
    mode,
    format: settings?.videoQuality
      ? `${mode === 'audio' ? 'audio' : settings.videoQuality + 'p'} / ${settings?.audioFormat || 'aac'} / ${settings?.fileContainer || 'auto'}`
      : mode,
    codec: settings?.videoCodec || 'auto',
    container: settings?.fileContainer || 'auto',
    ramUsedMB: Math.round(memStart.rss / 1024 / 1024),
  });

  try {
    // Update job progress
    await job.updateProgress({ status: 'fetching_info', progress: 0 });
    broadcastProgress(jobId, { status: 'fetching_info', progress: 0 });

    // Get video info first
    const videoInfo = await getVideoInfo(url);
    const videoId = extractVideoId(url);

    await job.updateProgress({
      status: 'starting',
      progress: 5,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
    });
    broadcastProgress(jobId, {
      status: 'starting',
      progress: 5,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
    });

    // Download video with progress callback
    const result = await downloadVideo(url, settings, mode, (progressData) => {
      // Update job progress
      job.updateProgress({
        ...progressData,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
      }).catch(err => {
        logger.error('Failed to update job progress', { jobId, error: err.message });
      });

      // Broadcast to WebSocket clients
      broadcastProgress(jobId, {
        ...progressData,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
      });
    });

    // Mark as completed
    await job.updateProgress({
      status: 'completed',
      progress: 100,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
    });
    broadcastProgress(jobId, {
      status: 'completed',
      progress: 100,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
    });

    logger.info('Job completed', {
      jobId,
      videoId,
      title: videoInfo.title,
      durationSec: Math.round((Date.now() - startTime) / 1000),
      ramUsedMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      ramDeltaMB: Math.round((process.memoryUsage().rss - memStart.rss) / 1024 / 1024),
    });

    return {
      success: true,
      videoId,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      path: result.path,
    };
  } catch (error) {
    logger.error('Download job failed', { jobId, error: error.message, stack: error.stack });

    // Broadcast error
    broadcastProgress(jobId, {
      status: 'error',
      progress: 0,
      error: error.message,
    });

    throw error;
  }
}

// Create worker
const worker = new Worker('downloads', processDownloadJob, {
  connection: config.redis,
  concurrency: config.maxConcurrentDownloads,
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000, // Per minute (rate limiting)
  },
  settings: {
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 1, // Mark as failed after 1 stall
  },
});

// Worker event handlers
worker.on('ready', () => {
  logger.info('Worker ready', { concurrency: config.maxConcurrentDownloads });
});

worker.on('active', (job) => {
  logger.info('Worker processing job', { jobId: job.id });
});

worker.on('completed', (job, result) => {
  logger.info('Worker completed job', { jobId: job.id, result });
});

worker.on('failed', (job, error) => {
  logger.error('Worker failed job', { 
    jobId: job?.id, 
    error: error.message,
    attempts: job?.attemptsMade,
    maxAttempts: job?.opts?.attempts,
  });
});

worker.on('error', (error) => {
  logger.error('Worker error', { error: error.message });
});

worker.on('stalled', (jobId) => {
  logger.warn('Job stalled', { jobId });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker gracefully');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker gracefully');
  await worker.close();
  process.exit(0);
});

logger.info('Worker started', {
  concurrency: config.maxConcurrentDownloads,
  timeout: config.jobTimeout,
  maxRetries: config.jobMaxRetries,
});

module.exports = worker;
