# AI Tools Status - MCP Server & API

This folder contains the backend services for monitoring AI tools status.

## 📁 Structure

```
mcp-server/
├── ai-mcp-server.js      # MCP server for Kiro integration
├── ai-status-api.js      # HTTP API server (port 3001)
├── package.json          # Dependencies
├── start-services.sh     # Start both MCP + API
├── start-api.sh          # Start API only
├── test-performance.js   # Performance testing tool
└── README.md            # This file
```

## 🚀 Quick Start

### Install Dependencies
```bash
cd mcp-server
npm install
```

### Start Services

**Option 1: Start both MCP server and API**
```bash
./start-services.sh
```

**Option 2: Start API only**
```bash
./start-api.sh
```

**Option 3: Manual start**
```bash
# MCP Server (for Kiro)
node ai-mcp-server.js

# HTTP API (for chat model)
node ai-status-api.js
```

## 🔧 Services

### 1. MCP Server (`ai-mcp-server.js`)
- **Purpose**: Provides MCP tools for Kiro integration
- **Protocol**: Model Context Protocol (stdio)
- **Tools**:
  - `get_ai_tools_status` - Get status of all AI tools
  - `check_specific_tool` - Check specific tool by name

### 2. HTTP API Server (`ai-status-api.js`)
- **Purpose**: Fast HTTP API for chat model integration
- **Port**: 3001
- **Endpoints**:
  - `GET /health` - API health check
  - `GET /status` - All tools status
  - `GET /status/:toolName` - Specific tool status

## 🎯 Monitored Services

1. **AI Model (Ollama)** - `https://chat-api.retakt.cc`
2. **Web Search (SearXNG)** - `https://search-api.retakt.cc`
3. **Weather API** - `https://wttr.in`
4. **Exchange Rate API** - `https://open.er-api.com`
5. **YouTube Backend** - `https://yt.retakt.cc`

## 🧪 Testing

Run the performance test:
```bash
node test-performance.js
```

This tests:
- AI model response times
- Tool detection speed
- Intelligent mode switching
- Cold start detection
- Overall system performance

## 🔗 Integration

### Chat Provider Integration
The chat provider (`src/components/providers/chat.tsx`) uses the HTTP API:

```typescript
async function toolGetAIToolsStatus(toolName?: string): Promise<string> {
  const response = await fetch('http://localhost:3001/status', {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  // ... handle response
}
```

### Terminal Integration
The admin terminal (`src/components/admin/simple-terminal.tsx`) can check status via:
- `ai-status` command - Check all tools
- `ai-check <tool>` command - Check specific tool

## 📊 Performance Metrics

With optimizations:
- **Cold start**: ~10-15 seconds (first request)
- **Warm requests**: ~1-2 seconds (model loaded)
- **Tool detection**: ~5 seconds
- **Status check**: <1 second (via API)

## 🛠️ Configuration

Edit the service URLs in `ai-mcp-server.js` and `ai-status-api.js`:

```javascript
const AI_TOOLS = [
  {
    name: 'AI Model (Ollama)',
    url: 'https://chat-api.retakt.cc/api/tags',
    timeout: 5000,
  },
  // ... more services
];
```

## 📝 Notes

- The MCP server runs on stdio (for Kiro)
- The HTTP API runs on port 3001 (for chat model)
- Both can run simultaneously using `start-services.sh`
- Status checks are cached for performance
- All services support CORS for web integration
