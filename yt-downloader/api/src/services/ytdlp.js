const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Convert frontend settings to yt-dlp arguments with fallbacks
 */
function settingsToArgs(settings, mode) {
  const args = [];

  // Output directory and filename
  const outputTemplate = path.join(
    config.downloadDir,
    '%(id)s',
    settings.filenamePattern || '%(title)s'
  ) + '.%(ext)s';
  args.push('-o', outputTemplate);

  // Video quality with fallbacks
  if (mode !== 'audio') {
    if (settings.videoQuality === 'max') {
      // Try best quality with fallback to lower qualities
      args.push('-f', 'bestvideo[height<=2160]+bestaudio/bestvideo[height<=1080]+bestaudio/best');
    } else {
      const height = settings.videoQuality;
      // Add fallback to next lower quality
      const fallbackHeight = Math.floor(height * 0.75);
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/bestvideo[height<=${fallbackHeight}]+bestaudio/best[height<=${height}]`);
    }
  }

  // Audio only mode
  if (mode === 'audio') {
    args.push('-x'); // Extract audio
    if (settings.audioFormat !== 'best') {
      args.push('--audio-format', settings.audioFormat);
    }
    args.push('--audio-quality', settings.audioQuality + 'K');
  }

  // Mute mode (video without audio)
  if (mode === 'mute') {
    args.push('-f', 'bestvideo');
  }

  // Video codec preference with fallbacks
  if (mode === 'auto') {
    switch (settings.videoCodec) {
      case 'h264':
        args.push('--format-sort', 'vcodec:h264,vcodec:avc1,acodec:aac');
        break;
      case 'av1':
        args.push('--format-sort', 'vcodec:av01,vcodec:vp9,acodec:opus');
        break;
      case 'vp9':
        args.push('--format-sort', 'vcodec:vp9,vcodec:h264,acodec:opus');
        break;
      default:
        // Auto: prefer h264 for compatibility
        args.push('--format-sort', 'vcodec:h264,vcodec:avc1');
    }
  }

  // Container format with fallback
  if (settings.fileContainer !== 'auto') {
    args.push('--merge-output-format', settings.fileContainer);
    args.push('--remux-video', settings.fileContainer); // Fallback remux
  }

  // Embed thumbnail (with error tolerance)
  if (settings.embedThumbnail) {
    args.push('--embed-thumbnail');
    args.push('--convert-thumbnails', 'jpg'); // Ensure compatibility
  }

  // Embed metadata
  if (settings.embedMetadata) {
    args.push('--embed-metadata');
  }

  // Subtitles
  if (settings.downloadSubtitles) {
    args.push('--write-subs');
    args.push('--write-auto-subs'); // Include auto-generated
    if (settings.subtitleLang) {
      args.push('--sub-langs', settings.subtitleLang);
    }
  }

  if (settings.embedSubtitles) {
    args.push('--embed-subs');
  }

  // Progress reporting
  args.push('--newline');
  args.push('--no-warnings');

  // Continue on errors (don't abort entire download)
  args.push('--ignore-errors');
  args.push('--no-abort-on-error');

  // User agent and cookies for rate limit avoidance
  args.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Use cookie file if available
  const cookiePath = process.env.COOKIES_PATH || '/app/youtube_cookies.txt';
  if (require('fs').existsSync(cookiePath)) {
    args.push('--cookies', cookiePath);
  }
  
  // Use Node.js as JavaScript runtime for signature solving
  args.push('--extractor-args', 'youtube:js_runtime=node');
  
  // Add po-token if available (required for YouTube in 2026)
  const poToken = process.env.YOUTUBE_PO_TOKEN;
  const visitorData = process.env.YOUTUBE_VISITOR_DATA;
  if (poToken && visitorData) {
    args.push('--extractor-args', `youtube:po_token=${poToken}:visitor_data=${visitorData}`);
  }
  
  // Sleep intervals to avoid rate limiting
  args.push('--sleep-interval', '3');
  args.push('--max-sleep-interval', '10');
  
  // Additional options to avoid bot detection and handle errors
  args.push('--extractor-retries', '5');
  args.push('--fragment-retries', '10');
  args.push('--retry-sleep', '5');
  
  // Prefer free formats (avoid premium-only)
  args.push('--prefer-free-formats');

  return args;
}

/**
 * Download video with timeout enforcement
 */
async function downloadVideo(url, settings, mode, onProgress) {
  const args = settingsToArgs(settings, mode);
  
  logger.info('Starting download', { url, mode, args });

  return new Promise((resolve, reject) => {
    let killed = false;
    let videoInfo = null;
    let downloadPath = null;

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
    proc.on('exit', (code, signal) => {
      clearTimeout(timeout);

      if (killed) {
        return; // Already rejected with timeout error
      }

      if (code === 0) {
        // Get file size if we have the path
        let fileSizeMB = null;
        if (downloadPath) {
          try {
            const stat = require('fs').statSync(downloadPath);
            fileSizeMB = Math.round(stat.size / 1024 / 1024 * 10) / 10;
          } catch {}
        }
        logger.info('Download completed', { url, path: downloadPath, fileSizeMB });
        resolve({
          success: true,
          path: downloadPath,
          videoId: extractVideoId(url),
          fileSizeMB,
        });
      } else {
        const error = `yt-dlp exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
        logger.error('Download failed', { url, code, signal });
        reject(new Error(error));
      }
    });

    // Handle process errors
    proc.on('error', (err) => {
      clearTimeout(timeout);
      logger.error('Process error', { error: err.message });
      reject(err);
    });
  });
}

/**
 * Get video info without downloading
 */
async function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    logger.info('Fetching video info', { url });
    
    const cookiePath = process.env.COOKIES_PATH || '/app/youtube_cookies.txt';
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:js_runtime=node',
    ];

    if (require('fs').existsSync(cookiePath)) {
      args.push('--cookies', cookiePath);
    }
    
    // Add po-token if available
    const poToken = process.env.YOUTUBE_PO_TOKEN;
    const visitorData = process.env.YOUTUBE_VISITOR_DATA;
    if (poToken && visitorData) {
      args.push('--extractor-args', `youtube:po_token=${poToken}:visitor_data=${visitorData}`);
    }
    
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

    proc.on('exit', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdout);
          resolve({
            id: info.id,
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            uploader: info.uploader,
            viewCount: info.view_count,
            description: info.description,
          });
        } catch (error) {
          logger.error('Failed to parse video info', { error: error.message });
          reject(new Error('Failed to parse video information'));
        }
      } else {
        logger.error('Failed to fetch video info', { url, stderr });
        reject(new Error('Failed to fetch video information'));
      }
    });

    proc.on('error', (error) => {
      logger.error('Process error fetching video info', { error: error.message });
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
 * Find downloaded file in directory
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
    
    return file ? path.join(dir, file) : null;
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
