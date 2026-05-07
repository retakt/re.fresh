#!/bin/bash
# Check All AI Services
# Runs all AI service checks and provides a summary

echo "================================================================"
echo "  AI SERVICES HEALTH CHECK"
echo "================================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Track results
total=0
passed=0

# Check Ollama
echo "1. Ollama AI Model"
echo "---"
if "$SCRIPT_DIR/check-ollama.sh" 2>&1 | grep -q "OPERATIONAL"; then
  passed=$((passed + 1))
fi
total=$((total + 1))
echo ""

# Check SearXNG
echo "2. SearXNG Web Search"
echo "---"
if "$SCRIPT_DIR/check-searxng.sh" 2>&1 | grep -q "OPERATIONAL"; then
  passed=$((passed + 1))
fi
total=$((total + 1))
echo ""

# Summary
echo "================================================================"
echo "  SUMMARY"
echo "================================================================"
echo ""
echo "Services Checked: $total"
echo "Operational: $passed"
echo "Down: $((total - passed))"
echo ""

if [ $passed -eq $total ]; then
  echo "✅ All AI services are operational"
  exit 0
else
  echo "⚠️  Some AI services are down"
  exit 1
fi
