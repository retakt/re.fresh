const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const Redis = require('ioredis');
const config = require('../config');

/**
 * Cookie Pool Manager
 * Manages multiple YouTube cookie files with health tracking and rotation
 */
class CookiePool {
  constructor() {
    this.cookiesDir = process.env.COOKIES_DIR || '/app/cookies';
    this.redis = new Redis(config.redis);
    this.healthKey = 'cookie:health';
    this.lastUsedKey = 'cookie:lastused';
    this.minCooldownMs = parseInt(process.env.COOKIE_COOLDOWN_MS, 10) || 60000; // 60 seconds default
    this.failureThreshold = parseFloat(process.env.COOKIE_FAILURE_THRESHOLD) || 0.3; // 30% failure rate
    this.healthCheckWindow = 20; // Track last 20 requests per cookie
  }

  /**
   * Initialize cookie pool - scan directory for cookie files
   */
  async initialize() {
    try {
      // Ensure cookies directory exists
      await fs.mkdir(this.cookiesDir, { recursive: true });
      
      const files = await fs.readdir(this.cookiesDir);
      const cookieFiles = files.filter(f => f.endsWith('.txt'));
      
      if (cookieFiles.length === 0) {
        logger.warn('No cookie files found in pool', { dir: this.cookiesDir });
        
        // Check for legacy single cookie file
        const legacyCookiePath = '/app/youtube_cookies.txt';
        try {
          await fs.access(legacyCookiePath);
          logger.info('Found legacy cookie file, copying to pool');
          await fs.copyFile(legacyCookiePath, path.join(this.cookiesDir, 'cookie_001.txt'));
          cookieFiles.push('cookie_001.txt');
        } catch {
          logger.error('No cookies available - system will not work!');
        }
      }
      
      logger.info('Cookie pool initialized', { 
        count: cookieFiles.length,
        files: cookieFiles,
        cooldownMs: this.minCooldownMs,
        failureThreshold: this.failureThreshold
      });
      
      return cookieFiles;
    } catch (error) {
      logger.error('Failed to initialize cookie pool', { error: error.message });
      throw error;
    }
  }

  /**
   * Get next available cookie from pool
   * Returns cookie with lowest recent usage and good health
   */
  async getNextCookie() {
    const cookieFiles = await this.getCookieFiles();
    
    if (cookieFiles.length === 0) {
      throw new Error('No cookies available in pool');
    }

    const now = Date.now();
    const cookieScores = [];

    // Score each cookie based on health and last usage
    for (const cookieFile of cookieFiles) {
      const health = await this.getCookieHealth(cookieFile);
      const lastUsed = await this.getLastUsed(cookieFile);
      const timeSinceUse = now - lastUsed;
      
      // Skip cookies in cooldown period
      if (timeSinceUse < this.minCooldownMs) {
        logger.debug('Cookie in cooldown', { 
          cookie: cookieFile, 
          cooldownRemaining: Math.round((this.minCooldownMs - timeSinceUse) / 1000) + 's'
        });
        continue;
      }

      // Skip unhealthy cookies
      if (health.failureRate > this.failureThreshold) {
        logger.warn('Cookie unhealthy, skipping', { 
          cookie: cookieFile, 
          failureRate: health.failureRate,
          threshold: this.failureThreshold
        });
        continue;
      }

      // Score: prefer older usage time and better health
      const score = timeSinceUse * (1 - health.failureRate);
      cookieScores.push({ cookieFile, score, health, lastUsed });
    }

    if (cookieScores.length === 0) {
      // All cookies in cooldown or unhealthy - use least recently used anyway
      logger.warn('All cookies in cooldown or unhealthy, using least recently used');
      const fallback = cookieFiles[0];
      await this.markUsed(fallback);
      return path.join(this.cookiesDir, fallback);
    }

    // Sort by score (highest first)
    cookieScores.sort((a, b) => b.score - a.score);
    const selected = cookieScores[0];

    logger.info('Selected cookie from pool', {
      cookie: selected.cookieFile,
      failureRate: selected.health.failureRate,
      successCount: selected.health.successCount,
      failureCount: selected.health.failureCount,
      lastUsedAgo: Math.round((now - selected.lastUsed) / 1000) + 's'
    });

    // Mark as used
    await this.markUsed(selected.cookieFile);

    return path.join(this.cookiesDir, selected.cookieFile);
  }

  /**
   * Get all cookie files in pool
   */
  async getCookieFiles() {
    try {
      const files = await fs.readdir(this.cookiesDir);
      return files.filter(f => f.endsWith('.txt')).sort();
    } catch (error) {
      logger.error('Failed to read cookie files', { error: error.message });
      return [];
    }
  }

  /**
   * Mark cookie as used (update timestamp)
   */
  async markUsed(cookieFile) {
    const key = `${this.lastUsedKey}:${cookieFile}`;
    await this.redis.set(key, Date.now());
  }

  /**
   * Get last used timestamp for cookie
   */
  async getLastUsed(cookieFile) {
    const key = `${this.lastUsedKey}:${cookieFile}`;
    const timestamp = await this.redis.get(key);
    return timestamp ? parseInt(timestamp, 10) : 0;
  }

  /**
   * Record success for cookie
   */
  async recordSuccess(cookieFile) {
    const key = `${this.healthKey}:${cookieFile}`;
    await this.redis.lpush(key, '1');
    await this.redis.ltrim(key, 0, this.healthCheckWindow - 1);
    
    logger.debug('Recorded cookie success', { cookie: cookieFile });
  }

  /**
   * Record failure for cookie
   */
  async recordFailure(cookieFile) {
    const key = `${this.healthKey}:${cookieFile}`;
    await this.redis.lpush(key, '0');
    await this.redis.ltrim(key, 0, this.healthCheckWindow - 1);
    
    logger.warn('Recorded cookie failure', { cookie: cookieFile });
  }

  /**
   * Get health stats for cookie
   */
  async getCookieHealth(cookieFile) {
    const key = `${this.healthKey}:${cookieFile}`;
    const results = await this.redis.lrange(key, 0, -1);
    
    if (results.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        totalRequests: 0,
        failureRate: 0,
        status: 'new'
      };
    }

    const successCount = results.filter(r => r === '1').length;
    const failureCount = results.filter(r => r === '0').length;
    const totalRequests = results.length;
    const failureRate = failureCount / totalRequests;

    let status = 'healthy';
    if (failureRate > this.failureThreshold) {
      status = 'unhealthy';
    } else if (failureRate > this.failureThreshold * 0.5) {
      status = 'degraded';
    }

    return {
      successCount,
      failureCount,
      totalRequests,
      failureRate: Math.round(failureRate * 100) / 100,
      status
    };
  }

  /**
   * Get health stats for all cookies
   */
  async getAllCookieHealth() {
    const cookieFiles = await this.getCookieFiles();
    const healthStats = [];

    for (const cookieFile of cookieFiles) {
      const health = await this.getCookieHealth(cookieFile);
      const lastUsed = await this.getLastUsed(cookieFile);
      const now = Date.now();
      const cooldownRemaining = Math.max(0, this.minCooldownMs - (now - lastUsed));

      healthStats.push({
        cookie: cookieFile,
        ...health,
        lastUsed: lastUsed || null,
        lastUsedAgo: lastUsed ? Math.round((now - lastUsed) / 1000) : null,
        inCooldown: cooldownRemaining > 0,
        cooldownRemaining: cooldownRemaining > 0 ? Math.round(cooldownRemaining / 1000) : 0
      });
    }

    return healthStats;
  }

  /**
   * Reset health stats for a cookie
   */
  async resetCookieHealth(cookieFile) {
    const key = `${this.healthKey}:${cookieFile}`;
    await this.redis.del(key);
    logger.info('Reset cookie health', { cookie: cookieFile });
  }

  /**
   * Reset health stats for all cookies
   */
  async resetAllHealth() {
    const cookieFiles = await this.getCookieFiles();
    for (const cookieFile of cookieFiles) {
      await this.resetCookieHealth(cookieFile);
    }
    logger.info('Reset all cookie health stats');
  }

  /**
   * Duplicate a cookie file (useful for expanding pool with good cookies)
   */
  async duplicateCookie(sourceCookie, count = 1) {
    try {
      const sourcePath = path.join(this.cookiesDir, sourceCookie);
      const sourceContent = await fs.readFile(sourcePath, 'utf-8');
      
      const duplicated = [];
      const existingFiles = await this.getCookieFiles();
      
      // Find next available number
      let nextNum = 1;
      const numbers = existingFiles
        .map(f => {
          const match = f.match(/cookie_(\d+)\.txt/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      
      if (numbers.length > 0) {
        nextNum = Math.max(...numbers) + 1;
      }
      
      // Create duplicates
      for (let i = 0; i < count; i++) {
        const newName = `cookie_${String(nextNum).padStart(3, '0')}.txt`;
        const newPath = path.join(this.cookiesDir, newName);
        
        await fs.writeFile(newPath, sourceContent, 'utf-8');
        duplicated.push(newName);
        nextNum++;
        
        logger.info('Cookie duplicated', { source: sourceCookie, duplicate: newName });
      }
      
      return duplicated;
    } catch (error) {
      logger.error('Failed to duplicate cookie', { cookie: sourceCookie, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a cookie file from pool
   */
  async deleteCookie(cookieFile) {
    try {
      const cookiePath = path.join(this.cookiesDir, cookieFile);
      await fs.unlink(cookiePath);
      
      // Clean up health data
      await this.resetCookieHealth(cookieFile);
      
      logger.info('Cookie deleted', { cookie: cookieFile });
      return true;
    } catch (error) {
      logger.error('Failed to delete cookie', { cookie: cookieFile, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a cookie file from pool
   */
  async deleteCookie(cookieFile) {
    try {
      const cookiePath = path.join(this.cookiesDir, cookieFile);
      await fs.unlink(cookiePath);
      
      // Clean up health data
      await this.resetCookieHealth(cookieFile);
      
      logger.info('Cookie deleted', { cookie: cookieFile });
      return true;
    } catch (error) {
      logger.error('Failed to delete cookie', { cookie: cookieFile, error: error.message });
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
  }
}

// Singleton instance
let cookiePoolInstance = null;

function getCookiePool() {
  if (!cookiePoolInstance) {
    cookiePoolInstance = new CookiePool();
  }
  return cookiePoolInstance;
}

module.exports = {
  CookiePool,
  getCookiePool
};
