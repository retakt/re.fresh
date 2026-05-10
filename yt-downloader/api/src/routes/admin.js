const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../utils/logger');
const { readWorkerIP } = require('../utils/warp-ip');

// Admin authentication middleware
// Your main admin panel should send the token in Authorization header
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminTokens = (process.env.ADMIN_TOKEN || 're.takt').split(',').map(t => t.trim());
  
  // Debug logging
  logger.info('Admin auth attempt', {
    hasAuthHeader: !!authHeader,
    envToken: process.env.ADMIN_TOKEN ? `${process.env.ADMIN_TOKEN.substring(0, 10)}...` : 'NOT_SET',
    tokenCount: adminTokens.length,
  });
  
  if (!authHeader) {
    logger.warn('Admin auth failed: No authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  logger.info('Token comparison', {
    receivedToken: `${token.substring(0, 10)}...`,
    receivedLength: token.length,
    expectedLength: adminTokens[0].length,
    matches: adminTokens.includes(token),
  });
  
  if (!adminTokens.includes(token)) {
    logger.warn('Admin auth failed: Token mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  logger.info('Admin auth successful');
  next();
};

// Get system status - Call this from your main admin panel
router.get('/status', async (req, res) => {
  try {
    const cookiePath = '/app/youtube_cookies.txt';
    const wgcfPath = '/app/wgcf-account.toml';
    
    // Check if files exist
    const cookieExists = await fs.access(cookiePath).then(() => true).catch(() => false);
    const wgcfExists = await fs.access(wgcfPath).then(() => true).catch(() => false);
    
    // Get file stats and validate cookies
    let cookieAge = null;
    let cookieValid = false;
    let wgcfAge = null;
    
    if (cookieExists) {
      const stats = await fs.stat(cookiePath);
      cookieAge = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)); // days
      
      // Validate cookie format
      try {
        const cookieContent = await fs.readFile(cookiePath, 'utf8');
        // Check if it's in Netscape format and has YouTube cookies
        cookieValid = cookieContent.includes('# Netscape HTTP Cookie File') && 
                     cookieContent.includes('.youtube.com');
      } catch (error) {
        logger.error('Failed to read cookie file', { error: error.message });
        cookieValid = false;
      }
    }
    
    if (wgcfExists) {
      const stats = await fs.stat(wgcfPath);
      wgcfAge = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)); // days
    }
    
    // Check WARP connection by reading worker's IP file
    // Worker writes its IP to a shared file in /app/logs/
    let warpIP = null;
    let warpConnected = false;
    
    try {
      const ipFilePath = path.join(__dirname, '../../logs/worker-ip.json');
      const ipFileExists = await fs.access(ipFilePath).then(() => true).catch(() => false);
      
      if (ipFileExists) {
        const ipData = JSON.parse(await fs.readFile(ipFilePath, 'utf8'));
        warpIP = ipData.ip;
        warpConnected = ipData.connected;
        
        // Check if data is stale (older than 10 minutes)
        const dataAge = Date.now() - new Date(ipData.timestamp).getTime();
        if (dataAge > 10 * 60 * 1000) {
          logger.warn('Worker IP data is stale', { ageMinutes: Math.floor(dataAge / 60000) });
        }
      } else {
        logger.warn('Worker IP file not found');
        // Fallback: if wgcf exists, assume WARP is configured
        warpConnected = wgcfExists;
      }
    } catch (error) {
      logger.error('Failed to read worker IP', { error: error.message });
      // Fallback: if wgcf exists, assume WARP is configured
      warpConnected = wgcfExists;
    }
    
    res.json({
      service: 'youtube-downloader',
      cookies: {
        exists: cookieExists,
        valid: cookieValid,
        ageInDays: cookieAge,
        needsRotation: cookieAge > 7 || !cookieValid, // Rotate if old OR invalid
      },
      warp: {
        exists: wgcfExists,
        ageInDays: wgcfAge,
        currentIP: warpIP,
        connected: warpConnected,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get admin status', { error: error.message });
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Upload new cookies - Call this from your main admin panel
router.post('/cookies', async (req, res) => {
  try {
    const { cookies } = req.body;
    
    if (!cookies || typeof cookies !== 'string') {
      return res.status(400).json({ error: 'Invalid cookies format' });
    }
    
    // Validate Netscape format
    if (!cookies.includes('# Netscape HTTP Cookie File')) {
      return res.status(400).json({ error: 'Cookies must be in Netscape format' });
    }
    
    const cookiePath = '/app/youtube_cookies.txt';
    await fs.writeFile(cookiePath, cookies, 'utf8');
    
    logger.info('Admin uploaded new cookies');
    
    res.json({
      success: true,
      message: 'Cookies updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to update cookies', { error: error.message });
    res.status(500).json({ error: 'Failed to update cookies' });
  }
});

// Get download statistics - Call this from your main admin panel
router.get('/stats', async (req, res) => {
  try {
    const { downloadQueue } = require('../queue/queue');
    
    const [waiting, active, completed, failed] = await Promise.all([
      downloadQueue.getWaitingCount(),
      downloadQueue.getActiveCount(),
      downloadQueue.getCompletedCount(),
      downloadQueue.getFailedCount(),
    ]);
    
    res.json({
      service: 'youtube-downloader',
      queue: {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get stats', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get stats', details: error.message });
  }
});

// Health check endpoint (no auth required)
router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'youtube-downloader',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
