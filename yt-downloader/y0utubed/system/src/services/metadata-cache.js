const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Metadata Cache Service
 * Caches video metadata to avoid burning cookies on repeated info requests
 */
class MetadataCache {
  constructor() {
    this.redis = new Redis(config.redis);
    this.cachePrefix = 'video:metadata';
    this.defaultTTL = parseInt(process.env.METADATA_CACHE_TTL, 10) || 3600; // 1 hour default
  }

  /**
   * Generate cache key for video
   */
  getCacheKey(videoId) {
    return `${this.cachePrefix}:${videoId}`;
  }

  /**
   * Get cached metadata for video
   */
  async get(videoId) {
    try {
      const key = this.getCacheKey(videoId);
      const data = await this.redis.get(key);
      
      if (data) {
        const metadata = JSON.parse(data);
        logger.debug('Metadata cache hit', { videoId });
        return metadata;
      }
      
      logger.debug('Metadata cache miss', { videoId });
      return null;
    } catch (error) {
      logger.error('Failed to get cached metadata', { videoId, error: error.message });
      return null;
    }
  }

  /**
   * Set cached metadata for video
   */
  async set(videoId, metadata, ttl = null) {
    try {
      const key = this.getCacheKey(videoId);
      const data = JSON.stringify(metadata);
      const cacheTTL = ttl || this.defaultTTL;
      
      await this.redis.setex(key, cacheTTL, data);
      logger.debug('Metadata cached', { videoId, ttl: cacheTTL });
      
      return true;
    } catch (error) {
      logger.error('Failed to cache metadata', { videoId, error: error.message });
      return false;
    }
  }

  /**
   * Delete cached metadata for video
   */
  async delete(videoId) {
    try {
      const key = this.getCacheKey(videoId);
      await this.redis.del(key);
      logger.debug('Metadata cache deleted', { videoId });
      return true;
    } catch (error) {
      logger.error('Failed to delete cached metadata', { videoId, error: error.message });
      return false;
    }
  }

  /**
   * Clear all cached metadata
   */
  async clear() {
    try {
      const pattern = `${this.cachePrefix}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('Metadata cache cleared', { count: keys.length });
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Failed to clear metadata cache', { error: error.message });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const pattern = `${this.cachePrefix}:*`;
      const keys = await this.redis.keys(pattern);
      
      return {
        totalCached: keys.length,
        ttl: this.defaultTTL
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error: error.message });
      return {
        totalCached: 0,
        ttl: this.defaultTTL
      };
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
let metadataCacheInstance = null;

function getMetadataCache() {
  if (!metadataCacheInstance) {
    metadataCacheInstance = new MetadataCache();
  }
  return metadataCacheInstance;
}

module.exports = {
  MetadataCache,
  getMetadataCache
};
