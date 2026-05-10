/**
 * AI Status API Server
 * Simple Express server that reads monitor logs and serves status via HTTP
 */

require('dotenv').config();
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
      '/health': 'API health check',
      '/terminal/execute': 'Execute command in sandbox (POST)',
      '/terminal/analyze': 'Clone repo and analyze it (POST)',
      '/terminal/script': 'Run whitelisted script (POST)'
    }
  });
});

// ── Open Terminal proxy ───────────────────────────────────────────────────────
// Proxies requests to the Open Terminal sandbox container (port 8000).
// The sandbox is isolated — no access to host files.

const OPEN_TERMINAL_URL = process.env.OPEN_TERMINAL_URL || 'http://localhost:8000';
const OPEN_TERMINAL_API_KEY = process.env.OPEN_TERMINAL_API_KEY || '';

// Whitelisted scripts the AI is allowed to run by name
const SCRIPT_WHITELIST = {
  'health-check':    '/home/user/scripts/system/health-check.sh',
  'check-ollama':    '/home/user/scripts/ai/check-ollama.sh',
  'check-searxng':   '/home/user/scripts/ai/check-searxng.sh',
  'check-all-ai':    '/home/user/scripts/ai/check-all-services.sh',
  'ai-tools-status': '/home/user/scripts/status/ai-tools-status.sh',
  'monitor-status':  '/home/user/scripts/system/monitor-status.sh',
};

/**
 * Parse Open Terminal response into a plain string.
 *
 * Open Terminal returns:
 *   { process_id, status, exit_code, output: [{ stream, data }, ...] }
 *
 * output is an array of chunks — join them all into one string.
 * stderr is mixed in via stream === 'stderr' but we include everything.
 */
function parseOpenTerminalResponse(data) {
  // output is an array of { stream: 'stdout'|'stderr', data: string }
  if (Array.isArray(data.output) && data.output.length > 0) {
    return data.output.map(chunk => chunk.data ?? chunk).join('');
  }
  // Fallback for older/different response shapes
  if (typeof data.output === 'string') return data.output;
  if (typeof data.stdout === 'string') return data.stdout;
  return '';
}

/**
 * Call Open Terminal /execute with a wait timeout.
 * wait = seconds to wait for the command to finish before returning.
 * We set it high so long-running scripts (repo analysis, builds) complete.
 */
async function runInSandbox(command, waitSeconds = 300) {
  const response = await fetch(
    `${OPEN_TERMINAL_URL}/execute?wait=${waitSeconds}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPEN_TERMINAL_API_KEY}`,
      },
      // Wrap with 2>&1 so stderr is captured in the output array
      body: JSON.stringify({ command: `${command} 2>&1` }),
      // Node fetch timeout — give extra 30s buffer beyond the wait param
      signal: AbortSignal.timeout((waitSeconds + 30) * 1000),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Open Terminal error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return {
    output: parseOpenTerminalResponse(data),
    exit_code: data.exit_code ?? 0,
    status: data.status ?? 'done',
  };
}

/**
 * POST /terminal/execute
 * Execute any shell command in the sandbox.
 * Body: { command: string, timeout?: number }
 * timeout is in seconds, default 300 (5 min), max 600 (10 min)
 */
app.post('/terminal/execute', authenticate, async (req, res) => {
  const { command, timeout } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'command is required' });
  }

  const waitSeconds = Math.min(parseInt(timeout) || 300, 600);

  try {
    const result = await runInSandbox(command, waitSeconds);
    res.json({
      output: result.output,
      exit_code: result.exit_code,
      status: result.status,
    });
  } catch (err) {
    console.error('[terminal/execute] error:', err.message);
    res.status(503).json({ error: `Sandbox unavailable: ${err.message}` });
  }
});

/**
 * POST /terminal/analyze
 * Clone a git repo into the sandbox and run repo_analyzer.py on it.
 * Body: { repo_url: string, depth?: number }
 */
app.post('/terminal/analyze', authenticate, async (req, res) => {
  const { repo_url, depth = 2 } = req.body;
  if (!repo_url || typeof repo_url !== 'string') {
    return res.status(400).json({ error: 'repo_url is required' });
  }

  if (!/^https?:\/\/.+/.test(repo_url)) {
    return res.status(400).json({ error: 'repo_url must be a valid https URL' });
  }

  const repoName = repo_url.replace(/\.git$/, '').split('/').slice(-1)[0].replace(/[^a-zA-Z0-9_-]/g, '_');
  const repoPath = `/home/user/workspace/${repoName}`;
  const reportPath = `/home/user/workspace/${repoName}_report.md`;

  const command = [
    `rm -rf "${repoPath}"`,
    `git clone --depth 1 "${repo_url}" "${repoPath}"`,
    `python3 /home/user/scripts/repo-analyzer/repo_analyzer.py "${repoPath}" --output "${reportPath}" --depth ${depth}`,
    `cat "${reportPath}"`,
  ].join(' && ');

  try {
    // Allow up to 10 min for clone + analysis of large repos
    const result = await runInSandbox(command, 600);
    res.json({
      output: result.output,
      exit_code: result.exit_code,
      status: result.status,
      repo: repoName,
      report_path: reportPath,
    });
  } catch (err) {
    console.error('[terminal/analyze] error:', err.message);
    res.status(503).json({ error: `Sandbox unavailable: ${err.message}` });
  }
});

/**
 * POST /terminal/script
 * Run a whitelisted script in the sandbox.
 * Body: { script: string, args?: string }
 */
app.post('/terminal/script', authenticate, async (req, res) => {
  const { script, args = '' } = req.body;
  if (!script || typeof script !== 'string') {
    return res.status(400).json({ error: 'script is required' });
  }

  const scriptPath = SCRIPT_WHITELIST[script];
  if (!scriptPath) {
    return res.status(400).json({
      error: `Script "${script}" is not whitelisted`,
      available: Object.keys(SCRIPT_WHITELIST),
    });
  }

  const command = args ? `bash "${scriptPath}" ${args}` : `bash "${scriptPath}"`;

  try {
    // Scripts get up to 5 min
    const result = await runInSandbox(command, 300);
    res.json({
      output: result.output,
      exit_code: result.exit_code,
      status: result.status,
    });
  } catch (err) {
    console.error('[terminal/script] error:', err.message);
    res.status(503).json({ error: `Sandbox unavailable: ${err.message}` });
  }
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
