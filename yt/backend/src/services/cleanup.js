const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Clean up old downloaded files
 */
async function cleanupOldFiles() {
  try {
    const downloadDir = config.downloadDir;
    const retentionMs = config.fileRetentionHours * 60 * 60 * 1000;
    const now = Date.now();

    logger.info('Starting file cleanup', { downloadDir, retentionHours: config.fileRetentionHours });

    // Read all subdirectories (video IDs)
    const entries = await fs.readdir(downloadDir, { withFileTypes: true });
    const directories = entries.filter(e => e.isDirectory());

    let deletedCount = 0;
    let errorCount = 0;

    for (const dir of directories) {
      const dirPath = path.join(downloadDir, dir.name);
      
      try {
        const stats = await fs.stat(dirPath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
          // Delete entire directory
          await fs.rm(dirPath, { recursive: true, force: true });
          deletedCount++;
          logger.info('Deleted old download', { directory: dir.name, ageHours: (age / 3600000).toFixed(2) });
        }
      } catch (error) {
        errorCount++;
        logger.error('Failed to cleanup directory', { directory: dir.name, error: error.message });
      }
    }

    logger.info('Cleanup completed', { deletedCount, errorCount });
    return { deletedCount, errorCount };
  } catch (error) {
    logger.error('Cleanup failed', { error: error.message });
    throw error;
  }
}

/**
 * Start automatic cleanup interval
 */
function startCleanupSchedule() {
  const intervalMs = 10 * 60 * 1000; // Run every 10 minutes
  
  logger.info('Starting cleanup schedule', { intervalMinutes: 10 });
  
  // Run immediately
  cleanupOldFiles().catch(err => {
    logger.error('Initial cleanup failed', { error: err.message });
  });

  // Then run on interval
  setInterval(() => {
    cleanupOldFiles().catch(err => {
      logger.error('Scheduled cleanup failed', { error: err.message });
    });
  }, intervalMs);
}

/**
 * Delete specific download directory
 */
async function deleteDownload(videoId) {
  try {
    const dirPath = path.join(config.downloadDir, videoId);
    await fs.rm(dirPath, { recursive: true, force: true });
    logger.info('Deleted download', { videoId });
    return true;
  } catch (error) {
    logger.error('Failed to delete download', { videoId, error: error.message });
    return false;
  }
}

module.exports = {
  cleanupOldFiles,
  startCleanupSchedule,
  deleteDownload,
};
