#!/bin/bash

# Start AI Status API Server
# This provides HTTP endpoints for your chat model to check tool status

echo "Starting AI Status API Server..."
echo "API will be available at: http://localhost:3001"
echo ""
echo "Available endpoints:"
echo "  GET /health - API health check"
echo "  GET /status - All tools status"
echo "  GET /status/:toolName - Specific tool status"
echo ""
echo "Press Ctrl+C to stop"
echo ""

node ai-status-api.js