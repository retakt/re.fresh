/**
 * storage.js
 * 
 * Storage management API for the yt-downloader.
 * Designed for both manual use and future AI management.
 * 
 * Endpoints:
 *   GET  /api/storage/status     — disk usage, file count, oldest/newest file
 *   GET  /api/storage/files      — list all cached downloads with sizes/ages
 *   DELETE /api/storage/clean    — delete files older than X minutes (default: retention policy)
 *   DELETE /api/storage/purge    — wipe everything
 *   DELETE /api/storage/:videoId — delete a specific video folder
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../config');
const logger = require('../utils/logger');
const { cleanupOldFiles, deleteDownload } = require('../services/cleanup');

// ── Auth middleware ───────────────────────────────────────────────────────────
// Reuse the same admin token as the admin routes
function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== (config.adminToken || process.env.YT_ADMIN_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get size of a directory recursively in bytes
 */
async function getDirSize(dirPath) {
  try {
    const { stdout } = await execPromise(`du -sb "${dirPath}" 2>/dev/null | cut -f1`);
    return parseInt(stdout.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Get disk usage of the server partition
 */
async function getServerDisk() {
  try {
    const { stdout } = await execPromise(`df -B1 /opt 2>/dev/null | tail -1`);
    const parts = stdout.trim().split(/\s+/);
    return {
      totalBytes: parseInt(parts[1], 10),
      usedBytes: parseInt(parts[2], 10),
      freeBytes: parseInt(parts[3], 10),
      usePercent: parts[4],
    };
  } catch {
    return null;
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get age string from ms
 */
function formatAge(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h ago`;
}

/**
 * Scan download directory and return file metadata
 */
async function scanDownloads() {
  const downloadDir = config.downloadDir;
  const now = Date.now();
  const files = [];

  try {
    const entries = await fs.readdir(downloadDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory());

    for (const dir of dirs) {
      const dirPath = path.join(downloadDir, dir.name);
      try {
        const stat = await fs.stat(dirPath);
        const sizeBytes = await getDirSize(dirPath);
        const ageMs = now - stat.mtimeMs;

        // List files inside
        const innerFiles = await fs.readdir(dirPath).catch(() => []);
        const fileNames = innerFiles.filter(f => !f.endsWith('.part') && !f.endsWith('.ytdl'));
        const ext = fileNames[0]?.split('.').pop() || 'unknown';

        files.push({
          videoId: dir.name,
          sizeBytes,
          sizeHuman: formatBytes(sizeBytes),
          ageMs,
          ageHuman: formatAge(ageMs),
          modifiedAt: stat.mtime.toISOString(),
          files: fileNames,
          format: ext,
          expiresInMs: Math.max(0, (config.fileRetentionHours * 3600000) - ageMs),
          expiresInHuman: formatAge(Math.max(0, (config.fileRetentionHours * 3600000) - ageMs)).replace(' ago', ''),
          expired: ageMs > config.fileRetentionHours * 3600000,
        });
      } catch {
        // skip unreadable dirs
      }
    }
  } catch {
    // download dir might not exist yet
  }

  return files.sort((a, b) => b.ageMs - a.ageMs); // oldest first
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/storage/status
 * Quick overview — disk usage, cache size, file count
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const [files, disk] = await Promise.all([
      scanDownloads(),
      getServerDisk(),
    ]);

    const totalCacheBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
    const expiredFiles = files.filter(f => f.expired);
    const expiredBytes = expiredFiles.reduce((sum, f) => sum + f.sizeBytes, 0);

    res.json({
      cache: {
        totalFiles: files.length,
        totalSize: formatBytes(totalCacheBytes),
        totalSizeBytes: totalCacheBytes,
        expiredFiles: expiredFiles.length,
        expiredSize: formatBytes(expiredBytes),
        retentionHours: config.fileRetentionHours,
        downloadDir: config.downloadDir,
      },
      disk: disk ? {
        total: formatBytes(disk.totalBytes),
        used: formatBytes(disk.usedBytes),
        free: formatBytes(disk.freeBytes),
        usePercent: disk.usePercent,
        // Alert if disk is over 80% full
        alert: parseInt(disk.usePercent, 10) > 80,
      } : null,
      cleanupSchedule: 'Every 10 minutes (automatic)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Storage status failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/storage/files
 * List all cached downloads with full metadata
 */
router.get('/files', requireAuth, async (req, res) => {
  try {
    const files = await scanDownloads();
    res.json({
      count: files.length,
      files,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Storage list failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/storage/clean
 * Delete files older than X minutes (default: retention policy)
 * Query: ?olderThanMinutes=60
 */
router.delete('/clean', requireAuth, async (req, res) => {
  try {
    const olderThanMinutes = parseInt(req.query.olderThanMinutes, 10) || (config.fileRetentionHours * 60);
    const downloadDir = config.downloadDir;
    const cutoffMs = olderThanMinutes * 60 * 1000;
    const now = Date.now();

    const files = await scanDownloads();
    const toDelete = files.filter(f => f.ageMs > cutoffMs);

    let deleted = 0;
    let freed = 0;
    const errors = [];

    for (const file of toDelete) {
      try {
        await fs.rm(path.join(downloadDir, file.videoId), { recursive: true, force: true });
        freed += file.sizeBytes;
        deleted++;
        logger.info('Storage clean: deleted', { videoId: file.videoId, size: file.sizeHuman, age: file.ageHuman });
      } catch (err) {
        errors.push({ videoId: file.videoId, error: err.message });
      }
    }

    logger.info('Storage clean complete', { deleted, freed: formatBytes(freed), olderThanMinutes });

    res.json({
      deleted,
      freed: formatBytes(freed),
      freedBytes: freed,
      errors,
      olderThanMinutes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Storage clean failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/storage/purge
 * Wipe ALL cached downloads immediately
 */
router.delete('/purge', requireAuth, async (req, res) => {
  try {
    const files = await scanDownloads();
    const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
    const downloadDir = config.downloadDir;

    let deleted = 0;
    const errors = [];

    for (const file of files) {
      try {
        await fs.rm(path.join(downloadDir, file.videoId), { recursive: true, force: true });
        deleted++;
      } catch (err) {
        errors.push({ videoId: file.videoId, error: err.message });
      }
    }

    logger.warn('Storage purged', { deleted, freed: formatBytes(totalBytes) });

    res.json({
      deleted,
      freed: formatBytes(totalBytes),
      freedBytes: totalBytes,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Storage purge failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/storage/:videoId
 * Delete a specific video's cached files
 */
router.delete('/:videoId', requireAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const dirPath = path.join(config.downloadDir, videoId);

    // Check it exists
    const stat = await fs.stat(dirPath).catch(() => null);
    if (!stat) {
      return res.status(404).json({ error: 'Video not found in cache', videoId });
    }

    const sizeBytes = await getDirSize(dirPath);
    await fs.rm(dirPath, { recursive: true, force: true });

    logger.info('Storage delete: specific video', { videoId, freed: formatBytes(sizeBytes) });

    res.json({
      deleted: true,
      videoId,
      freed: formatBytes(sizeBytes),
      freedBytes: sizeBytes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Storage delete failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
