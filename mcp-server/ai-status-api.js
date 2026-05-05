#!/usr/bin/env node

/**
 * AI Tools Status HTTP API
 * Provides REST API for AI tools status - used by chat models
 */

import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// AI Tools configuration - same as MCP server
const AI_TOOLS = [
  {
    name: 'AI Model (Ollama)',
    url: 'https://chat-api.retakt.cc/api/tags',
    timeout: 5000,
  },
  {
    name: 'Web Search (SearXNG)',
    url: 'https://search-api.retakt.cc/search?q=test&format=json',
    timeout: 5000,
  },
  {
    name: 'Weather API',
    url: 'https://wttr.in/test?format=j1',
    timeout: 8000,
  },
  {
    name: 'Exchange Rate API',
    url: 'https://open.er-api.com/v6/latest/USD',
    timeout: 8000,
  },
  {
    name: 'YouTube Backend',
    url: 'https://yt.retakt.cc/api/health',
    timeout: 5000,
  },
];

// Check service status with timing
async function checkService(service) {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const urlObj = new URL(service.url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(service.url, { timeout: service.timeout }, (res) => {
      const responseTime = Date.now() - startTime;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        let status = 'READY';
        if (responseTime > 2000) status = 'SLOW';

        resolve({
          name: service.name,
          status,
          responseTime,
          healthy: true,
        });
      } else {
        resolve({
          name: service.name,
          status: 'DOWN',
          responseTime,
          healthy: false,
        });
      }

      res.resume();
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'TIMEOUT',
        responseTime: service.timeout,
        healthy: false,
      });
    });

    req.on('error', () => {
      resolve({
        name: service.name,
        status: 'DOWN',
        responseTime: Date.now() - startTime,
        healthy: false,
      });
    });
  });
}

// Check all services
async function checkAllServices() {
  console.log('[AI Status API] Checking services...');
  
  const results = await Promise.all(
    AI_TOOLS.map(service => checkService(service))
  );

  const status = {
    timestamp: new Date().toISOString(),
    services: results,
    healthy: results.filter(r => r.healthy).length,
    total: results.length,
    summary: results.map(r => `${r.name}: ${r.status}${r.responseTime ? ` (${r.responseTime}ms)` : ''}`).join(', ')
  };

  console.log(`[AI Status API] ${status.healthy}/${status.total} services healthy`);
  return status;
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/status', async (req, res) => {
  try {
    const status = await checkAllServices();
    res.json(status);
  } catch (error) {
    console.error('Error checking services:', error);
    res.status(500).json({ error: 'Failed to check services' });
  }
});

app.get('/status/:toolName', async (req, res) => {
  try {
    const toolName = req.params.toolName;
    const service = AI_TOOLS.find(s => 
      s.name.toLowerCase().includes(toolName.toLowerCase()) ||
      toolName.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
    );

    if (!service) {
      return res.status(404).json({ 
        error: `Tool "${toolName}" not found`,
        available: AI_TOOLS.map(s => s.name)
      });
    }

    const result = await checkService(service);
    res.json(result);
  } catch (error) {
    console.error('Error checking specific service:', error);
    res.status(500).json({ error: 'Failed to check service' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[AI Status API] Server running on http://localhost:${PORT}`);
  console.log(`[AI Status API] Available endpoints:`);
  console.log(`  GET /health - API health check`);
  console.log(`  GET /status - All tools status`);
  console.log(`  GET /status/:toolName - Specific tool status`);
});