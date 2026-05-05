# AI Tools Monitoring System

Complete documentation for the AI tools status monitoring and terminal system.

## 📋 Overview

This system provides real-time monitoring of AI services through multiple interfaces:
- **Admin Terminal** - Interactive terminal in the web UI
- **MCP Server** - Integration with Kiro AI assistant
- **HTTP API** - Fast status checks for chat model
- **Background Monitor** - 24/7 service monitoring

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Admin Terminal  │         │  Chat Provider   │         │
│  │  (UI Component)  │         │  (AI Integration)│         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                     │
└───────────┼────────────────────────────┼─────────────────────┘
            │                            │
            ▼                            ▼
┌───────────────────────┐    ┌──────────────────────┐
│  Open Terminal API    │    │  HTTP Status API     │
│  (Port 8001)          │    │  (Port 3001)         │
│  - Execute commands   │    │  - GET /status       │
│  - Run bash scripts   │    │  - GET /status/:tool │
└───────────────────────┘    └──────────────────────┘
            │                            │
            └────────────┬───────────────┘
                         ▼
            ┌────────────────────────┐
            │   Background Monitor   │
            │   (Bash Scripts)       │
            │   - 24/7 monitoring    │
            │   - Logging            │
            └────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │    AI Services         │
            │  - Ollama (AI Model)   │
            │  - SearXNG (Search)    │
            │  - Weather API         │
            │  - Exchange Rate API   │
            │  - YouTube Backend     │
            └────────────────────────┘
```

## 📁 Project Structure

```
project/
├── mcp-server/                    # MCP & API services
│   ├── ai-mcp-server.js          # MCP server for Kiro
│   ├── ai-status-api.js          # HTTP API (port 3001)
│   ├── package.json              # Dependencies
│   ├── start-services.sh         # Start both services
│   ├── start-api.sh              # Start API only
│   ├── test-performance.js       # Performance testing
│   └── README.md                 # MCP documentation
│
├── scripts/                       # Terminal monitoring scripts
│   ├── ai-monitor.sh             # Main monitoring loop
│   ├── start-monitor.sh          # Start background monitor
│   ├── stop-monitor.sh           # Stop background monitor
│   ├── show-monitor.sh           # Show monitor status
│   └── README.md                 # Scripts documentation
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── simple-terminal.tsx        # Terminal UI component
│   │   │   └── terminal-status/           # Status display components
│   │   └── providers/
│   │       └── chat.tsx                   # Chat provider with AI tools
│   │
│   ├── lib/
│   │   └── terminal.ts                    # Terminal API client
│   │
│   └── pages/
│       └── admin/
│           └── page.tsx                   # Admin page with terminal
│
├── logs/                          # Monitoring logs
│   ├── ai-monitor.log            # Service status logs
│   └── ai-monitor.pid            # Monitor process ID
│
├── .env.local                     # Environment configuration
├── performance-comparison-report.md  # Performance analysis
└── MONITORING_SYSTEM.md          # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install MCP server dependencies
cd mcp-server
npm install
cd ..

# Install main app dependencies
npm install
```

### 2. Configure Environment

Edit `.env.local`:
```env
# Ollama AI Model
VITE_OLLAMA_URL=https://chat-api.retakt.cc

# SearXNG Search
VITE_SEARXNG_URL=https://search-api.retakt.cc

# Open Terminal (for command execution)
VITE_OPEN_TERMINAL_URL=http://localhost:8001
VITE_OPEN_TERMINAL_API_KEY=terminal123
```

### 3. Start Services

**Start the HTTP API:**
```bash
cd mcp-server
./start-api.sh
```

**Start the web app:**
```bash
npm run dev
```

**Start background monitoring (optional):**
```bash
./scripts/start-monitor.sh
```

## 🎯 Features

### 1. Admin Terminal
- **Location**: `/admin` page
- **Features**:
  - Real-time service status checks
  - Command execution via Open Terminal
  - Color-coded response times
  - Auto-refresh monitoring
  - Coffee mug status indicator

**Commands:**
- `system-status` - Check all services
- `ai-status` - Check via HTTP API
- `ai-check <tool>` - Check specific tool
- `start-monitor` - Start background monitoring
- `stop-monitor` - Stop background monitoring
- `clear` - Clear terminal
- `help` - Show help

### 2. Chat AI Integration
- **Location**: Chat provider
- **Features**:
  - AI can check tool status automatically
  - Intelligent mode switching (no-think/balanced/full-think)
  - Tool pre-detection for faster responses
  - Keep-alive optimization

**AI Tools:**
- `get_ai_tools_status` - Check all tools
- `get_weather` - Weather information
- `get_exchange_rate` - Currency conversion
- `search_web` - Web search
- `get_time` - Time in any timezone

### 3. Background Monitoring
- **Location**: `scripts/` folder
- **Features**:
  - 24/7 continuous monitoring
  - Automatic logging
  - Response time tracking
  - Service health alerts

### 4. MCP Server (Kiro Integration)
- **Location**: `mcp-server/` folder
- **Features**:
  - Model Context Protocol support
  - Stdio communication
  - Tool status checking
  - Integration with Kiro AI

## 📊 Monitored Services

| Service | URL | Timeout | Status Endpoint |
|---------|-----|---------|-----------------|
| AI Model (Ollama) | `https://chat-api.retakt.cc` | 5s | `/api/tags` |
| Web Search (SearXNG) | `https://search-api.retakt.cc` | 5s | `/search?q=test&format=json` |
| Weather API | `https://wttr.in` | 8s | `/test?format=j1` |
| Exchange Rate API | `https://open.er-api.com` | 8s | `/v6/latest/USD` |
| YouTube Backend | `https://yt.retakt.cc` | 5s | `/api/health` |

## ⚡ Performance Optimizations

### 1. Ollama Keep-Alive
**Problem**: 3-4 second cold start on every request

**Solution**: Set `OLLAMA_KEEP_ALIVE=-1` environment variable
```powershell
[Environment]::SetEnvironmentVariable("OLLAMA_KEEP_ALIVE", "-1", "User")
```

**Result**: 
- First request: ~10-15s (model load)
- Subsequent requests: ~1-2s (no reload)

### 2. Cloudflare Tunnel Optimization
**Problem**: Tunnel timeouts interfering with keep-alive

**Solution**: Update cloudflared config with extended timeouts
```yaml
originRequest:
  keepAliveTimeout: 300s
  keepAliveConnections: 100
  connectTimeout: 60s
```

**Result**: Stable connections, model stays loaded

### 3. Intelligent Mode Switching
**Problem**: Using full-think mode for simple queries wastes time

**Solution**: Auto-detect query complexity
- Simple queries → no-think mode (fastest)
- Tool usage → balanced mode (optimized)
- Complex queries → full-think mode (reasoning)

**Result**: 
- Simple queries: <10s
- Tool queries: <15s
- Complex queries: <30s

## 🧪 Testing

### Performance Test
```bash
cd mcp-server
node test-performance.js
```

Tests:
- Response times for different query types
- Tool detection speed
- Mode switching accuracy
- Cold start detection
- Overall system health

### Manual Testing
```bash
# Test HTTP API
curl http://localhost:3001/status

# Test specific tool
curl http://localhost:3001/status/AI%20Model

# Test Ollama directly
curl https://chat-api.retakt.cc/api/tags
```

## 🔧 Configuration

### Service URLs
Edit in `mcp-server/ai-status-api.js` and `scripts/ai-monitor.sh`

### Timeouts
- Local services: 3-5 seconds
- External APIs: 5-8 seconds
- Adjust based on network conditions

### Response Time Thresholds
- **Green (READY)**: <200ms (local), <500ms (external)
- **Yellow (SLOW)**: 200-1000ms (local), 500-2000ms (external)
- **Red (DOWN)**: >1000ms or connection failed

## 📝 Logs

### Monitor Logs
```bash
# View recent logs
tail -f logs/ai-monitor.log

# View all logs
cat logs/ai-monitor.log
```

### API Logs
API logs are printed to console when running `node ai-status-api.js`

## 🛠️ Troubleshooting

### Terminal Not Connecting
1. Check Open Terminal is running on port 8001
2. Verify `VITE_OPEN_TERMINAL_URL` in `.env.local`
3. Check API key matches

### Services Showing DOWN
1. Verify service URLs are accessible
2. Check network connectivity
3. Increase timeout values
4. Check service logs

### Slow Response Times
1. Check Ollama keep-alive is set
2. Verify cloudflared config is applied
3. Check server load
4. Monitor network latency

### API Not Starting
1. Check port 3001 is available
2. Install dependencies: `cd mcp-server && npm install`
3. Check Node.js version (requires v14+)

## 📚 Additional Documentation

- **MCP Server**: See `mcp-server/README.md`
- **Scripts**: See `scripts/README.md`
- **Performance**: See `performance-comparison-report.md`

## 🔗 Related Files

- **Terminal Component**: `src/components/admin/simple-terminal.tsx`
- **Terminal API**: `src/lib/terminal.ts`
- **Chat Provider**: `src/components/providers/chat.tsx`
- **Admin Page**: `src/pages/admin/page.tsx`

## 📈 Future Improvements

- [ ] Add email/SMS alerts for service failures
- [ ] Implement service health dashboard
- [ ] Add historical performance graphs
- [ ] Support for custom service monitoring
- [ ] Webhook notifications
- [ ] Multi-region monitoring
- [ ] Auto-recovery mechanisms
