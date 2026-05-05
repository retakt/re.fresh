#!/usr/bin/env node

/**
 * AI Tools Status MCP Server
 * Provides real-time status of AI tools for chat models
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';
import http from 'http';

// AI Tools configuration
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
  console.error('[AI Tools MCP] Checking services...');
  
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

  console.error(`[AI Tools MCP] ${status.healthy}/${status.total} services healthy`);
  return status;
}

// Create MCP server
const server = new Server(
  {
    name: 'ai-tools-status',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_ai_tools_status',
        description: 'Get the current status of all AI tools and services',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_specific_tool',
        description: 'Check the status of a specific AI tool',
        inputSchema: {
          type: 'object',
          properties: {
            tool_name: {
              type: 'string',
              description: 'Name of the tool to check (AI Model, Web Search, Weather API, Exchange Rate API, YouTube Backend)',
            },
          },
          required: ['tool_name'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_ai_tools_status': {
        const status = await checkAllServices();
        return {
          content: [
            {
              type: 'text',
              text: `AI Tools Status Report (${new Date().toLocaleTimeString()}):

${status.services.map(s => 
  `• ${s.name}: ${s.status}${s.responseTime ? ` (${s.responseTime}ms)` : ''}`
).join('\n')}

Summary: ${status.healthy}/${status.total} services are healthy
${status.healthy === status.total ? '✅ All systems operational' : 
  status.healthy === 0 ? '🔴 All systems down' : 
  '⚠️ Some services experiencing issues'}`,
            },
          ],
        };
      }

      case 'check_specific_tool': {
        const toolName = args.tool_name;
        const service = AI_TOOLS.find(s => 
          s.name.toLowerCase().includes(toolName.toLowerCase()) ||
          toolName.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
        );

        if (!service) {
          return {
            content: [
              {
                type: 'text',
                text: `Tool "${toolName}" not found. Available tools: ${AI_TOOLS.map(s => s.name).join(', ')}`,
              },
            ],
          };
        }

        const result = await checkService(service);
        return {
          content: [
            {
              type: 'text',
              text: `${result.name}: ${result.status}${result.responseTime ? ` (${result.responseTime}ms)` : ''}
Status: ${result.healthy ? '✅ Operational' : '🔴 Down'}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[AI Tools MCP] Server started');
}

main().catch((error) => {
  console.error('[AI Tools MCP] Server error:', error);
  process.exit(1);
});