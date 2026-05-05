/**
 * AI Status API Server
 * Simple Express server that reads monitor logs and serves status via HTTP
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const API_KEY = process.env.API_KEY || 'terminal123'; // Same as Open Terminal API key

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Check Bearer token or X-API-Key header
  const providedKey = authHeader?.replace('Bearer ', '') || apiKey;
  
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required. Use Authorization: Bearer <key> or X-API-Key: <key>'
    });
  }
  
  next();
}

// Path to monitor log file
const LOG_FILE = path.join(__dirname, '..', 'logs', 'ai-monitor.log');

/**
 * Parse the latest status from monitor log
 */
function parseLatestStatus() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return {
        error: 'Monitor log not found',
        message: 'Start the monitor with: start-monitor',
        services: [],
        healthy: 0,
        total: 0,
        timestamp: new Date().toISOString()
      };
    }

    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    // Find the last health check block
    let lastCheckIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('Health Check -')) {
        lastCheckIndex = i;
        break;
      }
    }

    if (lastCheckIndex === -1) {
      return {
        error: 'No health check data found',
        services: [],
        healthy: 0,
        total: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Extract timestamp from header
    const timestampMatch = lines[lastCheckIndex].match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const timestamp = timestampMatch ? new Date(timestampMatch[1]).toISOString() : new Date().toISOString();

    // Parse services from the block
    const services = [];
    for (let i = lastCheckIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Stop at next health check or end
      if (line.includes('Health Check -') || line.includes('===')) {
        break;
      }

      // Parse service line: "  ● AI Model                READY    304ms  HTTP 200"
      const serviceMatch = line.match(/●\s+([^R|S|D|W]+?)\s+(READY|SLOW|DOWN|WARN)\s+(\d+)ms\s+HTTP\s+(\d+)/);
      if (serviceMatch) {
        const [, name, status, responseTime, httpCode] = serviceMatch;
        services.push({
          name: name.trim(),
          status: status.trim(),
          responseTime: parseInt(responseTime),
          httpCode: parseInt(httpCode),
          healthy: status.trim() === 'READY'
        });
      } else {
        // Handle DOWN status (no response time)
        const downMatch = line.match(/●\s+([^D]+?)\s+DOWN/);
        if (downMatch) {
          services.push({
            name: downMatch[1].trim(),
            status: 'DOWN',
            responseTime: null,
            httpCode: null,
            healthy: false
          });
        }
      }
    }

    const healthy = services.filter(s => s.healthy).length;
    const total = services.length;

    return {
      timestamp,
      services,
      healthy,
      total,
      allHealthy: healthy === total
    };

  } catch (error) {
    console.error('Error parsing log:', error);
    return {
      error: 'Failed to parse monitor log',
      message: error.message,
      services: [],
      healthy: 0,
      total: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * GET /status
 * Returns all services with latest status
 * Requires authentication
 */
app.get('/status', authenticate, (req, res) => {
  const status = parseLatestStatus();
  res.json(status);
});

/**
 * GET /status/:serviceName
 * Returns specific service status
 * Requires authentication
 */
app.get('/status/:serviceName', authenticate, (req, res) => {
  const { serviceName } = req.params;
  const status = parseLatestStatus();

  if (status.error) {
    return res.status(503).json(status);
  }

  // Find service (case-insensitive)
  const service = status.services.find(s => 
    s.name.toLowerCase().includes(serviceName.toLowerCase())
  );

  if (!service) {
    return res.status(404).json({
      error: 'Service not found',
      serviceName,
      available: status.services.map(s => s.name)
    });
  }

  res.json({
    ...service,
    timestamp: status.timestamp
  });
});

/**
 * GET /health
 * Simple health check for the API itself
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * API info
 */
app.get('/', (req, res) => {
  res.json({
    name: 'AI Status API',
    version: '1.0.0',
    endpoints: {
      '/status': 'Get all services status',
      '/status/:serviceName': 'Get specific service status',
      '/health': 'API health check'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log('  AI Status API Server');
  console.log('================================================================');
  console.log(`  Port: ${PORT}`);
  console.log(`  Log File: ${LOG_FILE}`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    GET http://localhost:${PORT}/status`);
  console.log(`    GET http://localhost:${PORT}/status/:serviceName`);
  console.log(`    GET http://localhost:${PORT}/health`);
  console.log('');
  console.log('  Status: Running');
  console.log('================================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});
