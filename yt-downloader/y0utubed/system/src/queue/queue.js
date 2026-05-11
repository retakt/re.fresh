const { Queue } = require('bullmq');
const config = require('../config');
const logger = require('../utils/logger');

// Create download queue
const downloadQueue = new Queue('downloads', {
  connection: config.redis,
  defaultJobOptions: {
    attempts: config.jobMaxRetries,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Queue event handlers
downloadQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

downloadQueue.on('waiting', ({ jobId }) => {
  logger.info('Job waiting', { jobId });
});

downloadQueue.on('active', ({ jobId }) => {
  logger.info('Job active', { jobId });
});

downloadQueue.on('completed', ({ jobId, returnvalue }) => {
  logger.info('Job completed', { jobId, result: returnvalue });
});

downloadQueue.on('failed', ({ jobId, failedReason }) => {
  logger.error('Job failed', { jobId, reason: failedReason });
});

/**
 * Add download job to queue
 */
async function addDownloadJob(data) {
  const { url, mode, settings } = data;
  
  const job = await downloadQueue.add('download', {
    url,
    mode,
    settings,
    createdAt: Date.now(),
  }, {
    jobId: `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  });

  logger.info('Download job added', { jobId: job.id, url, mode });
  
  return job;
}

/**
 * Get job by ID
 */
async function getJob(jobId) {
  return await downloadQueue.getJob(jobId);
}

/**
 * Cancel job
 */
async function cancelJob(jobId) {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  await job.remove();
  logger.info('Job cancelled', { jobId });
  
  return true;
}

/**
 * Get queue stats
 */
async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    downloadQueue.getWaitingCount(),
    downloadQueue.getActiveCount(),
    downloadQueue.getCompletedCount(),
    downloadQueue.getFailedCount(),
    downloadQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

module.exports = {
  downloadQueue,
  addDownloadJob,
  getJob,
  cancelJob,
  getQueueStats,
};
