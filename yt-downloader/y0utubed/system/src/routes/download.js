const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { addDownloadJob, getJob, cancelJob, getQueueStats } = require('../queue/queue');
const { isValidYouTubeUrl, validateSettings, isValidMode } = require('../utils/validation');
const { findDownloadedFile, extractVideoId } = require('../services/ytdlp');
const { deleteDownload } = require('../services/cleanup');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/download
 * Start a new download
 */
router.post('/download', async (req, res) => {
  try {
    const { url, mode, settings } = req.body;

    // Validate URL
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({
        error: 'Invalid YouTube URL',
        code: 'INVALID_URL',
      });
    }

    // Validate mode
    if (!mode || !isValidMode(mode)) {
      return res.status(400).json({
        error: 'Invalid download mode',
        code: 'INVALID_MODE',
      });
    }

    // Validate settings
    if (settings) {
      const validation = validateSettings(settings);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid settings',
          code: 'INVALID_SETTINGS',
          details: validation.errors,
        });
      }
    }

    // Add job to queue
    const job = await addDownloadJob({ url, mode, settings });

    res.json({
      id: job.id,
      status: 'pending',
      progress: 0,
    });
  } catch (error) {
    logger.error('Failed to start download', { error: error.message });
    res.status(500).json({
      error: 'Failed to start download',
      code: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

/**
 * GET /api/download/:id
 * Get download status
 */
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await getJob(id);

    if (!job) {
      return res.status(404).json({
        error: 'Download not found',
        code: 'NOT_FOUND',
      });
    }

    const state = await job.getState();
    const progress = job.progress || {};

    let status = 'pending';
    if (state === 'completed') status = 'completed';
    else if (state === 'failed') status = 'error';
    else if (state === 'active') status = progress.status || 'downloading';

    const response = {
      id: job.id,
      status,
      progress: progress.progress || 0,
      title: progress.title,
      thumbnail: progress.thumbnail,
    };

    if (state === 'failed') {
      response.error = job.failedReason || 'Download failed';
    }

    if (state === 'completed' && job.returnvalue) {
      response.videoId = job.returnvalue.videoId;
      response.downloadUrl = `/api/download/${id}/file`;
    }

    res.json(response);
  } catch (error) {
    logger.error('Failed to get download status', { id: req.params.id, error: error.message });
    res.status(500).json({
      error: 'Failed to get download status',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * DELETE /api/download/:id
 * Cancel a download
 */
router.delete('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await getJob(id);

    if (!job) {
      return res.status(404).json({
        error: 'Download not found',
        code: 'NOT_FOUND',
      });
    }

    // Cancel the job
    await cancelJob(id);

    // Delete downloaded files if any
    if (job.returnvalue?.videoId) {
      await deleteDownload(job.returnvalue.videoId);
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to cancel download', { id: req.params.id, error: error.message });
    res.status(500).json({
      error: 'Failed to cancel download',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/download/:id/file
 * Download the completed file
 */
router.get('/download/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await getJob(id);

    if (!job) {
      return res.status(404).json({
        error: 'Download not found',
        code: 'NOT_FOUND',
      });
    }

    const state = await job.getState();
    if (state !== 'completed') {
      return res.status(400).json({
        error: 'Download not completed',
        code: 'NOT_COMPLETED',
      });
    }

    const videoId = job.returnvalue?.videoId;
    if (!videoId) {
      return res.status(404).json({
        error: 'Video file not found',
        code: 'FILE_NOT_FOUND',
      });
    }

    // Find the downloaded file
    const filePath = await findDownloadedFile(videoId);
    if (!filePath) {
      return res.status(404).json({
        error: 'Video file not found',
        code: 'FILE_NOT_FOUND',
      });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'Video file not found',
        code: 'FILE_NOT_FOUND',
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Sanitize filename for HTTP header (remove invalid characters)
    const safeFileName = fileName
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      .replace(/[＂＇｀]/g, '"') // Replace fullwidth quotes with regular quotes
      .replace(/[^\x20-\x7E]/g, '_'); // Replace other non-ASCII with underscore

    // Set headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      logger.error('File stream error', { filePath, error: error.message });
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to stream file',
          code: 'STREAM_ERROR',
        });
      }
    });
  } catch (error) {
    logger.error('Failed to download file', { id: req.params.id, error: error.message });
    res.status(500).json({
      error: 'Failed to download file',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/stats
 * Get queue statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to get stats',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;
