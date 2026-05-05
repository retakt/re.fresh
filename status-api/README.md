# AI Status API

Simple Express server that reads monitor logs and serves status via HTTP API.

## What It Does

- Reads `logs/ai-monitor.log` (created by terminal monitor)
- Parses latest service status
- Exposes HTTP endpoints for AI to query

## Installation

```bash
cd status-api
npm install
```

## Usage

### Start Server
```bash
./start.sh
# or
npm start
```

### Stop Server
```bash
./stop.sh
```

### Check Status
```bash
curl http://localhost:3002/status
```

## API Endpoints

### GET /status
Returns all services with latest status

**Response:**
```json
{
  "timestamp": "2026-05-05T18:30:05Z",
  "services": [
    {
      "name": "AI Model",
      "status": "READY",
      "responseTime": 150,
      "httpCode": 200,
      "healthy": true
    }
  ],
  "healthy": 4,
  "total": 5,
  "allHealthy": false
}
```

### GET /status/:serviceName
Returns specific service status

**Example:**
```bash
curl http://localhost:3002/status/ai-model
```

**Response:**
```json
{
  "name": "AI Model",
  "status": "READY",
  "responseTime": 150,
  "httpCode": 200,
  "healthy": true,
  "timestamp": "2026-05-05T18:30:05Z"
}
```

### GET /health
API health check

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2026-05-05T18:30:05Z"
}
```

## How It Works

1. Terminal monitor runs → logs to `logs/ai-monitor.log`
2. Status API reads log file
3. Parses latest health check block
4. Serves data via HTTP endpoints
5. AI can fetch and display status

## Integration

Your AI chat system (`src/components/providers/chat.tsx`) already has the code to call this API:

```typescript
const response = await fetch('http://localhost:3002/status');
const data = await response.json();
```

## Requirements

- Node.js installed
- Monitor running (`start-monitor` in terminal)
- Port 3002 available

## Logs

- Server logs: `logs/status-api.log`
- PID file: `logs/status-api.pid`

## Troubleshooting

**API returns "Monitor log not found":**
- Start the monitor first: `start-monitor` in terminal

**Port 3002 already in use:**
- Stop other services on that port
- Or change PORT in server.js

**No data returned:**
- Check if monitor is running
- Check `logs/ai-monitor.log` exists and has data
