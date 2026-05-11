const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../utils/logger');
const { getCookiePool } = require('./cookie-pool');
const { getMetadataCache } = require('./metadata-cache');

/**
 * Convert frontend settings to yt-dlp arguments with fallbacks
 */
async function settingsToArgs(settings, mode, cookiePath = null) {
  const args = [];

  // ── Output template with quality indicator ────────────────────────────────
  // We'll add quality info to the filename after download based on what we got
  const outputTemplate = path.join(
    config.downloadDir,
    '%(id)s',
    settings.filenamePattern || '%(title)s'
  ) + '.%(ext)s';
  args.push('-o', outputTemplate);

  // ── Format selection with aggressive fallbacks ────────────────────────────
  
  if (mode === 'audio') {
    // Audio mode: Extract audio with format fallbacks
    args.push('-x'); // Extract audio
    
    // Audio format with fallbacks: requested → mp3 → best
    const audioFormat = settings.audioFormat || 'mp3';
    if (audioFormat !== 'best') {
      args.push('--audio-format', audioFormat);
      args.push('--audio-quality', (settings.audioQuality || 192) + 'K');
    }
    
    // Fallback: if extraction fails, try direct audio download
    args.push('-f', 'bestaudio/best');
    
  } else if (mode === 'mute') {
    // Mute mode: Video only, no audio
    args.push('-f', 'bestvideo/best');
    
  } else {
    // Auto/Video mode: Video + Audio with quality fallbacks
    const requestedHeight = settings.videoQuality === 'max' ? 2160 : (settings.videoQuality || 1080);
    
    // Build format selector with cascading fallbacks
    // Try: requested quality → 75% of requested → 50% of requested → best available
    const fallback1 = Math.floor(requestedHeight * 0.75);
    const fallback2 = Math.floor(requestedHeight * 0.5);
    const fallback3 = Math.floor(requestedHeight * 0.33);
    
    const formatSelector = [
      `bestvideo[height<=${requestedHeight}]+bestaudio`,
      `bestvideo[height<=${fallback1}]+bestaudio`,
      `bestvideo[height<=${fallback2}]+bestaudio`,
      `bestvideo[height<=${fallback3}]+bestaudio`,
      'best[height<=1080]',
      'best[height<=720]',
      'best[height<=480]',
      'best'
    ].join('/');
    
    args.push('-f', formatSelector);
    
    // Video codec preference (with fallbacks built into format-sort)
    const codec = settings.videoCodec || 'h264';
    switch (codec) {
      case 'h264':
        args.push('--format-sort', 'vcodec:h264,vcodec:avc1,vcodec:vp9,acodec:aac,acodec:mp4a');
        break;
      case 'av1':
        args.push('--format-sort', 'vcodec:av01,vcodec:vp9,vcodec:h264,acodec:opus,acodec:aac');
        break;
      case 'vp9':
        args.push('--format-sort', 'vcodec:vp9,vcodec:h264,vcodec:av01,acodec:opus,acodec:aac');
        break;
      default:
        args.push('--format-sort', 'vcodec:h264,vcodec:avc1');
    }
  }

  // ── Container format with fallback ────────────────────────────────────────
  const container = settings.fileContainer || 'auto';
  if (container !== 'auto') {
    args.push('--merge-output-format', container);
    // If merge fails, remux as fallback
    args.push('--remux-video', container);
  }

  // ── Metadata embedding (with error tolerance) ─────────────────────────────
  if (settings.embedThumbnail) {
    args.push('--embed-thumbnail');
    args.push('--convert-thumbnails', 'jpg');
  }

  if (settings.embedMetadata) {
    args.push('--embed-metadata');
  }

  // ── Subtitles ──────────────────────────────────────────────────────────────
  if (settings.downloadSubtitles) {
    args.push('--write-subs');
    args.push('--write-auto-subs');
    if (settings.subtitleLang) {
      args.push('--sub-langs', settings.subtitleLang);
    }
  }

  if (settings.embedSubtitles) {
    args.push('--embed-subs');
  }

  // ── Progress and error handling ───────────────────────────────────────────
  args.push('--newline');
  args.push('--no-warnings');
  args.push('--ignore-errors');      // Continue on non-fatal errors
  args.push('--no-abort-on-error');  // Don't abort entire download

  // ── JavaScript runtime for signature solving ──────────────────────────────
  args.push('--js-runtimes', 'node');

  // ── Authentication ─────────────────────────────────────────────────────────
  args.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  // Use provided cookie path or get from pool
  if (cookiePath) {
    args.push('--cookies', cookiePath);
  } else {
    // Fallback to legacy single cookie if pool not available
    const legacyCookiePath = process.env.COOKIES_PATH || '/app/youtube_cookies.txt';
    if (require('fs').existsSync(legacyCookiePath)) {
      args.push('--cookies', legacyCookiePath);
    }
  }

  // ── PO Token (bgutil) ──────────────────────────────────────────────────────
  args.push('--extractor-args', 'youtube:player_client=mweb,tv_embedded,web,default;youtubepot:provider=bgutil:http');

  // ── Retry logic ────────────────────────────────────────────────────────────
  args.push('--extractor-retries', '3');
  args.push('--fragment-retries', '5');

  return args;
}

/**
 * Download video with timeout enforcement and cookie pool
 */
async function downloadVideo(url, settings, mode, onProgress) {
  const cookiePool = getCookiePool();
  let cookiePath = null;
  let cookieFile = null;
  
  try {
    // Get cookie from pool
    cookiePath = await cookiePool.getNextCookie();
    cookieFile = path.basename(cookiePath);
    logger.info('Using cookie from pool', { cookie: cookieFile });
  } catch (error) {
    logger.warn('Failed to get cookie from pool, using legacy fallback', { error: error.message });
  }

  const args = await settingsToArgs(settings, mode, cookiePath);
  
  logger.info('Starting download', { url, mode, cookie: cookieFile, args });

  return new Promise((resolve, reject) => {
    let killed = false;
    let videoInfo = null;
    let downloadPath = null;
    let downloadSuccess = false;

    // Spawn yt-dlp — Docker handles WARP routing via network_mode: service:gluetun
    const proc = spawn('yt-dlp', [...args, url], {
      detached: false,
    });

    // Timeout enforcement
    const timeout = setTimeout(() => {
      if (!killed) {
        killed = true;
        logger.warn('Download timeout, killing process', { url });
        
        // Force kill the process
        try {
          proc.kill('SIGKILL');
        } catch (err) {
          logger.error('Failed to kill process', { error: err.message });
        }
        
        reject(new Error('Download timeout after ' + (config.jobTimeout / 1000) + ' seconds'));
      }
    }, config.jobTimeout);

    // Parse stdout for progress
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse progress
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      if (progressMatch && onProgress) {
        const progress = parseFloat(progressMatch[1]);
        onProgress({ progress, status: 'downloading' });
      }

      // Extract video info
      if (output.includes('[download] Destination:')) {
        const pathMatch = output.match(/\[download\] Destination: (.+)/);
        if (pathMatch) {
          downloadPath = pathMatch[1].trim();
        }
      }

      // Log output
      logger.debug('yt-dlp output', { output: output.trim() });
    });

    // Parse stderr for errors
    proc.stderr.on('data', (data) => {
      const error = data.toString();
      logger.error('yt-dlp error', { error: error.trim() });
    });

    // Handle process exit
    proc.on('exit', async (code, signal) => {
      clearTimeout(timeout);

      if (killed) {
        return; // Already rejected with timeout error
      }

      if (code === 0) {
        downloadSuccess = true;
        
        // Record cookie success
        if (cookieFile) {
          await cookiePool.recordSuccess(cookieFile).catch(err => {
            logger.error('Failed to record cookie success', { error: err.message });
          });
        }
        
        // If we didn't capture the path from stdout, find it in the download directory
        if (!downloadPath) {
          const videoId = extractVideoId(url);
          try {
            downloadPath = await findDownloadedFile(videoId);
          } catch (err) {
            logger.warn('Failed to find downloaded file', { videoId, error: err.message });
          }
        }

        // Get file size if we have the path
        let fileSizeMB = null;
        if (downloadPath) {
          try {
            const stat = require('fs').statSync(downloadPath);
            fileSizeMB = Math.round(stat.size / 1024 / 1024 * 10) / 10;
          } catch {}
        }
        logger.info('Download completed', { url, path: downloadPath, fileSizeMB, cookie: cookieFile });
        resolve({
          success: true,
          path: downloadPath,
          videoId: extractVideoId(url),
          fileSizeMB,
        });
      } else {
        // Record cookie failure
        if (cookieFile) {
          await cookiePool.recordFailure(cookieFile).catch(err => {
            logger.error('Failed to record cookie failure', { error: err.message });
          });
        }
        
        const error = `yt-dlp exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
        logger.error('Download failed', { url, code, signal, cookie: cookieFile });
        reject(new Error(error));
      }
    });

    // Handle process errors
    proc.on('error', async (err) => {
      clearTimeout(timeout);
      
      // Record cookie failure
      if (cookieFile) {
        await cookiePool.recordFailure(cookieFile).catch(err => {
          logger.error('Failed to record cookie failure', { error: err.message });
        });
      }
      
      logger.error('Process error', { error: err.message, cookie: cookieFile });
      reject(err);
    });
  });
}

/**
 * Get video info without downloading - with caching to save cookies
 */
async function getVideoInfo(url) {
  const videoId = extractVideoId(url);
  const metadataCache = getMetadataCache();
  
  // Check cache first
  const cached = await metadataCache.get(videoId);
  if (cached) {
    logger.info('Using cached video metadata', { videoId });
    return cached;
  }

  // Not in cache, fetch from YouTube
  const cookiePool = getCookiePool();
  let cookiePath = null;
  let cookieFile = null;
  
  try {
    cookiePath = await cookiePool.getNextCookie();
    cookieFile = path.basename(cookiePath);
    logger.info('Fetching video info with cookie', { videoId, cookie: cookieFile });
  } catch (error) {
    logger.warn('Failed to get cookie from pool for info fetch', { error: error.message });
  }

  return new Promise((resolve, reject) => {
    logger.info('Fetching video info', { url, cookie: cookieFile });

    const args = [
      '--dump-json',
      '--no-warnings',
      '--no-playlist',
      '-f', 'best',  // Don't validate, just accept whatever is available
      '--js-runtimes', 'node',  // Use Node.js for signature solving
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ];

    if (cookiePath && require('fs').existsSync(cookiePath)) {
      args.push('--cookies', cookiePath);
    }

    // bgutil provides po_token automatically via the installed plugin
    args.push('--extractor-args', 'youtube:player_client=mweb,tv_embedded,web,default;youtubepot:provider=bgutil:http');

    args.push(url);

    // Route through gluetun network namespace (WARP) if enabled
    const proc = spawn('yt-dlp', args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('exit', async (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdout);
          const metadata = {
            id: info.id,
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            uploader: info.uploader,
            viewCount: info.view_count,
            description: info.description,
          };
          
          // Cache the metadata
          await metadataCache.set(videoId, metadata);
          
          // Record cookie success
          if (cookieFile) {
            await cookiePool.recordSuccess(cookieFile).catch(err => {
              logger.error('Failed to record cookie success', { error: err.message });
            });
          }
          
          resolve(metadata);
        } catch (error) {
          // Record cookie failure
          if (cookieFile) {
            await cookiePool.recordFailure(cookieFile).catch(err => {
              logger.error('Failed to record cookie failure', { error: err.message });
            });
          }
          
          logger.error('Failed to parse video info', { error: error.message, cookie: cookieFile });
          reject(new Error('Failed to parse video information'));
        }
      } else {
        // Record cookie failure
        if (cookieFile) {
          await cookiePool.recordFailure(cookieFile).catch(err => {
            logger.error('Failed to record cookie failure', { error: err.message });
          });
        }
        
        logger.error('Failed to fetch video info', { url, stderr, cookie: cookieFile });
        reject(new Error('Failed to fetch video information'));
      }
    });

    proc.on('error', async (error) => {
      // Record cookie failure
      if (cookieFile) {
        await cookiePool.recordFailure(cookieFile).catch(err => {
          logger.error('Failed to record cookie failure', { error: err.message });
        });
      }
      
      logger.error('Process error fetching video info', { error: error.message, cookie: cookieFile });
      reject(error);
    });
  });
}

/**
 * Extract video ID from URL
 */
function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }
    return u.searchParams.get('v') || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Get download directory for a video
 */
function getDownloadDir(videoId) {
  return path.join(config.downloadDir, videoId);
}

/**
 * Find downloaded file in directory and add quality indicator to filename
 */
async function findDownloadedFile(videoId) {
  const dir = getDownloadDir(videoId);
  
  try {
    const files = await fs.readdir(dir);
    // Find the first video/audio file (not .part or .ytdl)
    const file = files.find(f => 
      !f.endsWith('.part') && 
      !f.endsWith('.ytdl') &&
      (f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mkv') || 
       f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus'))
    );
    
    if (!file) return null;
    
    const filePath = path.join(dir, file);
    
    // Try to detect actual quality using ffprobe
    try {
      const { spawn } = require('child_process');
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=height,width',
        '-of', 'json',
        filePath
      ]);
      
      let output = '';
      ffprobe.stdout.on('data', data => output += data);
      
      await new Promise((resolve) => {
        ffprobe.on('close', resolve);
        setTimeout(resolve, 2000); // Timeout after 2s
      });
      
      if (output) {
        const info = JSON.parse(output);
        const height = info.streams?.[0]?.height;
        
        if (height) {
          // Add quality indicator to filename
          const ext = path.extname(file);
          const nameWithoutExt = path.basename(file, ext);
          const qualityTag = `_[${height}p]`;
          
          // Only add tag if not already present
          if (!nameWithoutExt.includes('[') && !nameWithoutExt.includes('p]')) {
            const newName = nameWithoutExt + qualityTag + ext;
            const newPath = path.join(dir, newName);
            
            await fs.rename(filePath, newPath);
            return newPath;
          }
        }
      }
    } catch (err) {
      // If ffprobe fails, just return the original file
      logger.debug('Failed to detect quality', { error: err.message });
    }
    
    return filePath;
  } catch (error) {
    logger.error('Failed to find downloaded file', { videoId, error: error.message });
    return null;
  }
}

module.exports = {
  downloadVideo,
  getVideoInfo,
  extractVideoId,
  getDownloadDir,
  findDownloadedFile,
};
