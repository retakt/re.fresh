const WebSocket = require('ws');
const logger = require('../utils/logger');

// Store WebSocket connections by job ID
const connections = new Map();

/**
 * Initialize WebSocket server
 */
function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/api/ws',
  });

  wss.on('connection', (ws, req) => {
    // Extract job ID from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      ws.close(1008, 'Missing jobId parameter');
      return;
    }

    logger.info('WebSocket connection established', { jobId });

    // Store connection
    if (!connections.has(jobId)) {
      connections.set(jobId, new Set());
    }
    connections.get(jobId).add(ws);

    // Handle client messages (ping/pong for keep-alive)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        logger.error('Invalid WebSocket message', { error: error.message });
      }
    });

    // Handle connection close
    ws.on('close', () => {
      logger.info('WebSocket connection closed', { jobId });
      const jobConnections = connections.get(jobId);
      if (jobConnections) {
        jobConnections.delete(ws);
        if (jobConnections.size === 0) {
          connections.delete(jobId);
        }
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', { jobId, error: error.message });
    });

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connected',
      jobId,
      timestamp: Date.now(),
    }));
  });

  wss.on('error', (error) => {
    logger.error('WebSocket server error', { error: error.message });
  });

  logger.info('WebSocket server initialized');

  return wss;
}

/**
 * Broadcast progress update to all clients watching a job
 */
function broadcastProgress(jobId, data) {
  const jobConnections = connections.get(jobId);
  
  if (!jobConnections || jobConnections.size === 0) {
    return;
  }

  const message = JSON.stringify({
    type: 'progress',
    jobId,
    data,
    timestamp: Date.now(),
  });

  let sentCount = 0;
  let errorCount = 0;

  jobConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        sentCount++;
      } catch (error) {
        errorCount++;
        logger.error('Failed to send WebSocket message', { 
          jobId, 
          error: error.message 
        });
      }
    }
  });

  if (sentCount > 0) {
    logger.debug('Progress broadcast', { jobId, clients: sentCount, errors: errorCount });
  }
}

/**
 * Get connection count for a job
 */
function getConnectionCount(jobId) {
  const jobConnections = connections.get(jobId);
  return jobConnections ? jobConnections.size : 0;
}

/**
 * Close all connections for a job
 */
function closeJobConnections(jobId) {
  const jobConnections = connections.get(jobId);
  
  if (!jobConnections) {
    return;
  }

  jobConnections.forEach((ws) => {
    try {
      ws.close(1000, 'Job completed');
    } catch (error) {
      logger.error('Failed to close WebSocket', { jobId, error: error.message });
    }
  });

  connections.delete(jobId);
  logger.info('Closed all connections for job', { jobId });
}

module.exports = {
  initWebSocketServer,
  broadcastProgress,
  getConnectionCount,
  closeJobConnections,
};
