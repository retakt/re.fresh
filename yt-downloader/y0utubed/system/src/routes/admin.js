const express = require('express');
const { getCookiePool } = require('../services/cookie-pool');
const { getMetadataCache } = require('../services/metadata-cache');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Middleware to check admin token
 */
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  const adminToken = process.env.ADMIN_TOKEN || process.env.YT_ADMIN_TOKEN;

  if (!adminToken) {
    return res.status(500).json({
      error: 'Admin token not configured',
      code: 'NO_ADMIN_TOKEN',
    });
  }

  if (token !== adminToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
    });
  }

  next();
}

/**
 * GET /api/admin/cookies/health
 * Get health stats for all cookies
 */
router.get('/cookies/health', requireAdmin, async (req, res) => {
  try {
    const cookiePool = getCookiePool();
    const healthStats = await cookiePool.getAllCookieHealth();

    // Calculate summary stats
    const summary = {
      total: healthStats.length,
      healthy: healthStats.filter(c => c.status === 'healthy').length,
      degraded: healthStats.filter(c => c.status === 'degraded').length,
      unhealthy: healthStats.filter(c => c.status === 'unhealthy').length,
      new: healthStats.filter(c => c.status === 'new').length,
      inCooldown: healthStats.filter(c => c.inCooldown).length,
    };

    res.json({
      summary,
      cookies: healthStats,
    });
  } catch (error) {
    logger.error('Failed to get cookie health', { error: error.message });
    res.status(500).json({
      error: 'Failed to get cookie health',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/cookies/:cookieFile/reset
 * Reset health stats for a specific cookie
 */
router.post('/cookies/:cookieFile/reset', requireAdmin, async (req, res) => {
  try {
    const { cookieFile } = req.params;
    const cookiePool = getCookiePool();

    await cookiePool.resetCookieHealth(cookieFile);

    res.json({
      success: true,
      message: `Health stats reset for ${cookieFile}`,
    });
  } catch (error) {
    logger.error('Failed to reset cookie health', { error: error.message });
    res.status(500).json({
      error: 'Failed to reset cookie health',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/cookies/reset-all
 * Reset health stats for all cookies
 */
router.post('/cookies/reset-all', requireAdmin, async (req, res) => {
  try {
    const cookiePool = getCookiePool();
    await cookiePool.resetAllHealth();

    res.json({
      success: true,
      message: 'Health stats reset for all cookies',
    });
  } catch (error) {
    logger.error('Failed to reset all cookie health', { error: error.message });
    res.status(500).json({
      error: 'Failed to reset all cookie health',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/cookies/list
 * List all cookie files in pool
 */
router.get('/cookies/list', requireAdmin, async (req, res) => {
  try {
    const cookiePool = getCookiePool();
    const cookieFiles = await cookiePool.getCookieFiles();

    res.json({
      count: cookieFiles.length,
      cookies: cookieFiles,
    });
  } catch (error) {
    logger.error('Failed to list cookies', { error: error.message });
    res.status(500).json({
      error: 'Failed to list cookies',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/cache/stats
 * Get metadata cache statistics
 */
router.get('/cache/stats', requireAdmin, async (req, res) => {
  try {
    const metadataCache = getMetadataCache();
    const stats = await metadataCache.getStats();

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to get cache stats',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/cache/clear
 * Clear metadata cache
 */
router.post('/cache/clear', requireAdmin, async (req, res) => {
  try {
    const metadataCache = getMetadataCache();
    const count = await metadataCache.clear();

    res.json({
      success: true,
      message: `Cleared ${count} cached entries`,
      count,
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      error: 'Failed to clear cache',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/cookies/:cookieFile/duplicate
 * Duplicate a cookie file
 */
router.post('/cookies/:cookieFile/duplicate', requireAdmin, async (req, res) => {
  try {
    const { cookieFile } = req.params;
    const { count = 1 } = req.body;
    
    const cookiePool = getCookiePool();
    const duplicated = await cookiePool.duplicateCookie(cookieFile, count);

    res.json({
      success: true,
      message: `Created ${duplicated.length} duplicate(s)`,
      duplicated,
    });
  } catch (error) {
    logger.error('Failed to duplicate cookie', { error: error.message });
    res.status(500).json({
      error: 'Failed to duplicate cookie',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/cookies/:cookieFile
 * Delete a cookie file
 */
router.delete('/cookies/:cookieFile', requireAdmin, async (req, res) => {
  try {
    const { cookieFile } = req.params;
    const cookiePool = getCookiePool();

    await cookiePool.deleteCookie(cookieFile);

    res.json({
      success: true,
      message: `Cookie ${cookieFile} deleted`,
    });
  } catch (error) {
    logger.error('Failed to delete cookie', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete cookie',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/system/info
 * Get system information
 */
router.get('/system/info', requireAdmin, async (req, res) => {
  try {
    const cookiePool = getCookiePool();
    const metadataCache = getMetadataCache();

    const [cookieHealth, cacheStats, cookieFiles] = await Promise.all([
      cookiePool.getAllCookieHealth(),
      metadataCache.getStats(),
      cookiePool.getCookieFiles(),
    ]);

    const healthySummary = {
      total: cookieHealth.length,
      healthy: cookieHealth.filter(c => c.status === 'healthy').length,
      degraded: cookieHealth.filter(c => c.status === 'degraded').length,
      unhealthy: cookieHealth.filter(c => c.status === 'unhealthy').length,
      new: cookieHealth.filter(c => c.status === 'new').length,
    };

    res.json({
      cookies: {
        total: cookieFiles.length,
        health: healthySummary,
        cooldownMs: cookiePool.minCooldownMs,
        failureThreshold: cookiePool.failureThreshold,
      },
      cache: cacheStats,
      config: {
        maxConcurrentDownloads: process.env.MAX_CONCURRENT_DOWNLOADS || 3,
        jobTimeoutMs: process.env.JOB_TIMEOUT_MS || 300000,
        cookieCooldownMs: process.env.COOKIE_COOLDOWN_MS || 60000,
        metadataCacheTTL: process.env.METADATA_CACHE_TTL || 3600,
      },
    });
  } catch (error) {
    logger.error('Failed to get system info', { error: error.message });
    res.status(500).json({
      error: 'Failed to get system info',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

module.exports = router;
