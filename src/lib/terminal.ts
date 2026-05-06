/**
 * Open Terminal API Client
 * Connects to a real backend terminal service for executing commands
 * Uses user-approved terminal key from their profile
 */

const TERMINAL_URL = import.meta.env.VITE_OPEN_TERMINAL_URL ?? 'http://localhost:8001';

// Use environment variable for API key
const TERMINAL_API_KEY = import.meta.env.VITE_OPEN_TERMINAL_API_KEY ?? 'terminal123';

export function setTerminalKey(key: string) {
  // Do nothing - we use hardcoded key
}

export function getTerminalKey(): string | null {
  return TERMINAL_API_KEY;
}

export function clearTerminalKey() {
  // Do nothing - we use hardcoded key
}

interface ExecuteCommandResponse {
  process_id: string;
  status: 'running' | 'done' | 'killed';
  exit_code?: number;
  output?: Array<{ stream: string; data: string }>;
}

interface TerminalConfig {
  features: {
    terminal: boolean;
    notebooks: boolean;
    system: boolean;
  };
}

/**
 * Execute a shell command on the Open Terminal backend
 * Uses wait parameter to get immediate results
 */
/**
 * Execute a shell command on the Open Terminal backend
 * Open Terminal executes commands but may not capture output with wait parameter
 * We need to use shell redirection to capture output
 */
export async function executeTerminalCommand(
  command: string,
  timeout?: number
): Promise<string> {
  try {
    // Wrap command to ensure output is captured
    // Use 2>&1 to redirect stderr to stdout
    const wrappedCommand = `${command} 2>&1`;
    
    const response = await fetch(`${TERMINAL_URL}/execute?wait=${timeout ?? 10}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TERMINAL_API_KEY}`,
      },
      body: JSON.stringify({
        command: wrappedCommand,
      }),
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Terminal API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: ExecuteCommandResponse = await response.json();
    
    console.log('Terminal response:', result);
    
    // If we have output, return it
    if (result.output && result.output.length > 0) {
      // Handle new format: [{type: "output", data: "content"}]
      return result.output.map(o => o.data || o).join('');
    }
    
    // If command completed successfully but no output
    if (result.status === 'done' && result.exit_code === 0) {
      return ''; // Return empty string instead of message
    }
    
    if (result.status === 'done' && result.exit_code !== 0) {
      return `Command failed with exit code ${result.exit_code}`;
    }
    
    return 'Command is running...';
  } catch (error) {
    console.error('Failed to execute terminal command:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to Open Terminal. Make sure it is running and CORS is configured.');
    }
    throw error;
  }
}

/**
 * Get terminal configuration
 */
export async function getTerminalConfig(): Promise<TerminalConfig> {
  try {
    const response = await fetch(`${TERMINAL_URL}/api/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TERMINAL_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Terminal API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get terminal config:', error);
    throw error;
  }
}

/**
 * Check if Open Terminal is available
 */
export async function checkTerminalHealth(): Promise<boolean> {
  try {
    const config = await getTerminalConfig();
    return !!config.features?.terminal;
  } catch {
    return false;
  }
}

/**
 * Execute system status monitoring - enhanced version with more details
 */
export async function executeSystemStatusCheck(): Promise<string> {
  const script = `
echo "================================================================"
echo "  SYSTEM HEALTH CHECK - $(hostname)"
echo "================================================================"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "Uptime: $(uptime -p 2>/dev/null || echo 'N/A')"
echo ""
echo "----------------------------------------------------------------"
echo "  SERVICE HEALTH STATUS"
echo "----------------------------------------------------------------"

# Function to check service with detailed timing
check_service() {
    local name="$1"
    local url="$2"
    local timeout="$3"
    
    start_time=$(date +%s%3N)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)
    curl_exit=$?
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    if [ $curl_exit -eq 0 ] && [ "$http_code" = "200" ]; then
        if [ "$response_time" -lt 100 ]; then
            printf "  ● %-25s READY   %5dms  HTTP %s\\n" "$name" "$response_time" "$http_code"
        elif [ "$response_time" -lt 500 ]; then
            printf "  ● %-25s READY   %5dms  HTTP %s\\n" "$name" "$response_time" "$http_code"
        elif [ "$response_time" -lt 1000 ]; then
            printf "  ● %-25s SLOW    %5dms  HTTP %s\\n" "$name" "$response_time" "$http_code"
        elif [ "$response_time" -lt 2000 ]; then
            printf "  ● %-25s SLOW    %5dms  HTTP %s\\n" "$name" "$response_time" "$http_code"
        else
            printf "  ● %-25s SLOW    %5dms  HTTP %s\\n" "$name" "$response_time" "$http_code"
        fi
    elif [ $curl_exit -eq 0 ] && [ "$http_code" != "000" ]; then
        printf "  ● %-25s WARN    %5dms  HTTP %s\\n" "$name" "$response_time" "$http_code"
    else
        printf "  ● %-25s DOWN    timeout  Connection Failed\\n" "$name"
    fi
}

echo ""
echo "[AI & ML Services]"
check_service "AI Model (Ollama)" "https://chat-api.retakt.cc/api/tags" 5
check_service "Web Search (SearXNG)" "https://search-api.retakt.cc/search?q=test&format=json" 5

echo ""
echo "[External APIs]"
check_service "Weather API" "https://wttr.in/test?format=j1" 6
check_service "Exchange Rate API" "https://open.er-api.com/v6/latest/USD" 6

echo ""
echo "[Application Services]"
check_service "YouTube Backend" "https://yt.retakt.cc/api/health" 5
check_service "Open Terminal" "https://tmux.retakt.cc/api/config" 3

echo ""
echo "----------------------------------------------------------------"
echo "  SYSTEM RESOURCES"
echo "----------------------------------------------------------------"

# Memory info
if command -v free >/dev/null 2>&1; then
    mem_used=$(free -m | awk 'NR==2{print $3}')
    mem_total=$(free -m | awk 'NR==2{print $2}')
    mem_percent=$(awk "BEGIN {printf \\"%.1f\\", ($mem_used/$mem_total)*100}")
    printf "  Memory: %sMB / %sMB (%s%% used)\\n" "$mem_used" "$mem_total" "$mem_percent"
fi

# Disk info
if command -v df >/dev/null 2>&1; then
    df -h / | awk 'NR==2{printf "  Disk: %s / %s (%s used)\\n", $3, $2, $5}'
fi

# Load average
if [ -f /proc/loadavg ]; then
    cat /proc/loadavg | awk '{printf "  Load Average: %.2f, %.2f, %.2f (1m, 5m, 15m)\\n", $1, $2, $3}'
fi

# Process count
if command -v ps >/dev/null 2>&1; then
    proc_count=$(ps aux | wc -l)
    printf "  Processes: %s running\\n" "$proc_count"
fi

echo ""
echo "----------------------------------------------------------------"
echo "  NETWORK DIAGNOSTICS"
echo "----------------------------------------------------------------"

# DNS check
dns_start=$(date +%s%3N)
if nslookup google.com >/dev/null 2>&1; then
    dns_end=$(date +%s%3N)
    dns_time=$((dns_end - dns_start))
    printf "  DNS Resolution: OK (%sms)\\n" "$dns_time"
else
    echo "  DNS Resolution: FAILED"
fi

# Internet connectivity
ping_start=$(date +%s%3N)
if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
    ping_end=$(date +%s%3N)
    ping_time=$((ping_end - ping_start))
    printf "  Internet: Connected (ping: %sms)\\n" "$ping_time"
else
    echo "  Internet: No connectivity"
fi

echo ""
echo "================================================================"
echo "  Check completed at $(date '+%H:%M:%S')"
echo "================================================================"
`;

  const result = await executeTerminalCommand(script, 30);
  return result;
}

/**
 * Start the 24/7 background monitor
 */
export async function startBackgroundMonitor(): Promise<string> {
  const script = `
cd /workspace/host/var/www/retakt
mkdir -p logs

if [ -f logs/ai-monitor.pid ]; then
  PID=\$(cat logs/ai-monitor.pid)
  if kill -0 "\$PID" 2>/dev/null; then
    echo "Monitor already running (PID: \$PID)"
    exit 0
  fi
fi

cat > /tmp/monitor-script.sh << 'MONITOR_EOF'
#!/bin/bash
echo $$ > logs/ai-monitor.pid

while true; do
  {
    echo "================================================================"
    echo "  Health Check - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================================================"
    echo ""
    echo "[AI Services]"
    
    # AI Model
    start=\$(date +%s%3N)
    code=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://chat-api.retakt.cc/api/tags" 2>/dev/null)
    end=\$(date +%s%3N)
    time=\$((end - start))
    if [ "\$code" = "200" ]; then
      printf "  ● %-25s READY   %5dms  HTTP %s\n" "AI Model" "\$time" "\$code"
    else
      printf "  ● %-25s DOWN\n" "AI Model"
    fi
    
    # Web Search
    start=\$(date +%s%3N)
    code=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://search-api.retakt.cc/search?q=test&format=json" 2>/dev/null)
    end=\$(date +%s%3N)
    time=\$((end - start))
    if [ "\$code" = "200" ]; then
      printf "  ● %-25s READY   %5dms  HTTP %s\n" "Web Search" "\$time" "\$code"
    else
      printf "  ● %-25s DOWN\n" "Web Search"
    fi
    
    echo ""
    echo "[External APIs]"
    
    # Weather
    start=\$(date +%s%3N)
    code=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 6 "https://wttr.in/test?format=j1" 2>/dev/null)
    end=\$(date +%s%3N)
    time=\$((end - start))
    if [ "\$code" = "200" ]; then
      printf "  ● %-25s READY   %5dms  HTTP %s\n" "Weather API" "\$time" "\$code"
    else
      printf "  ● %-25s DOWN\n" "Weather API"
    fi
    
    # Exchange
    start=\$(date +%s%3N)
    code=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 6 "https://open.er-api.com/v6/latest/USD" 2>/dev/null)
    end=\$(date +%s%3N)
    time=\$((end - start))
    if [ "\$code" = "200" ]; then
      printf "  ● %-25s READY   %5dms  HTTP %s\n" "Exchange Rate" "\$time" "\$code"
    else
      printf "  ● %-25s DOWN\n" "Exchange Rate"
    fi
    
    echo ""
    echo "[App Services]"
    
    # YouTube
    start=\$(date +%s%3N)
    code=\$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://yt.retakt.cc/api/health" 2>/dev/null)
    end=\$(date +%s%3N)
    time=\$((end - start))
    if [ "\$code" = "200" ]; then
      printf "  ● %-25s READY   %5dms  HTTP %s\n" "YouTube API" "\$time" "\$code"
    else
      printf "  ● %-25s DOWN\n" "YouTube API"
    fi
    
    echo ""
  } >> logs/ai-monitor.log
  
  tail -n 2000 logs/ai-monitor.log > logs/ai-monitor.log.tmp 2>/dev/null && mv logs/ai-monitor.log.tmp logs/ai-monitor.log
  sleep 30
done
MONITOR_EOF

chmod +x /tmp/monitor-script.sh
nohup /tmp/monitor-script.sh > /dev/null 2>&1 &

sleep 2

if [ -f logs/ai-monitor.pid ]; then
  PID=\$(cat logs/ai-monitor.pid)
  if kill -0 "\$PID" 2>/dev/null; then
    echo "Monitor started successfully (PID: \$PID)"
    echo "Checking services every 30 seconds"
    echo "Use 'show-monitor' to view logs"
  else
    echo "Failed to start monitor"
    exit 1
  fi
else
  echo "Failed to start monitor"
  exit 1
fi
`;

  const result = await executeTerminalCommand(script, 15);
  return result;
}

/**
 * Stop the 24/7 background monitor
 */
export async function stopBackgroundMonitor(): Promise<string> {
  const script = `
cd /workspace/host/var/www/retakt

if [ ! -f logs/ai-monitor.pid ]; then
  echo "Monitor is not running (no PID file found)"
  exit 0
fi

PID=\$(cat logs/ai-monitor.pid)

if kill -0 "\$PID" 2>/dev/null; then
  kill "\$PID"
  rm -f logs/ai-monitor.pid
  echo "✓ Monitor stopped (PID: \$PID)"
else
  rm -f logs/ai-monitor.pid
  echo "Monitor was not running (stale PID file removed)"
fi
`;

  const result = await executeTerminalCommand(script, 10);
  return result;
}

/**
 * Get AI tools status from the local API server
 * This provides persistent status that doesn't depend on browser session
 */
export async function getAIToolsStatus(): Promise<string> {
  try {
    const response = await fetch('http://localhost:3002/status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AI Status API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the response for terminal display
    const lines = [
      `=== AI Tools Status (${new Date().toLocaleTimeString()}) ===`,
      '',
    ];
    
    data.services.forEach((service: any) => {
      const status = service.status;
      const time = service.responseTime ? `${service.responseTime}ms` : '';
      lines.push(`● ${service.name.padEnd(20)} ${status.padEnd(8)} ${time}`);
    });
    
    lines.push('');
    lines.push(`Health: ${data.healthy}/${data.total} services operational`);
    
    return lines.join('\n');
  } catch (error) {
    console.error('Failed to get AI tools status:', error);
    throw new Error('AI Status API is not available. Make sure the server is running on port 3001.');
  }
}

/**
 * Check specific AI tool status
 */
export async function checkSpecificAITool(toolName: string): Promise<string> {
  try {
    const response = await fetch(`http://localhost:3002/status/${encodeURIComponent(toolName)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json();
        return `Tool "${toolName}" not found. Available tools: ${errorData.available.join(', ')}`;
      }
      throw new Error(`AI Status API error: ${response.status}`);
    }

    const data = await response.json();
    
    const status = data.healthy ? '✅ Operational' : '🔴 Down';
    const time = data.responseTime ? ` (${data.responseTime}ms)` : '';
    
    return `${data.name}: ${data.status}${time}\nStatus: ${status}`;
  } catch (error) {
    console.error('Failed to check specific AI tool:', error);
    throw new Error('AI Status API is not available. Make sure the server is running on port 3001.');
  }
}

/**
 * Show monitor status and recent logs
 */
export async function showMonitorStatus(): Promise<string> {
  const script = `
cd /workspace/host/var/www/retakt

if [ ! -f logs/ai-monitor.log ]; then
  echo "Monitor log not found. Is the monitor running?"
  echo "Start it with: start-monitor"
  exit 1
fi

echo "=== AI Monitor Status ==="
echo ""

# Check if monitor is running
if [ -f logs/ai-monitor.pid ]; then
  PID=\$(cat logs/ai-monitor.pid)
  if kill -0 "\$PID" 2>/dev/null; then
    echo "Status: ✓ RUNNING (PID: \$PID)"
  else
    echo "Status: ✗ STOPPED (stale PID file)"
  fi
else
  echo "Status: ✗ NOT STARTED"
fi

echo ""
echo "=== Recent Logs (last 30 lines) ==="
echo ""
tail -n 30 logs/ai-monitor.log
`;

  const result = await executeTerminalCommand(script, 10);
  return result;
}

/**
 * View live monitor logs
 */
export async function viewMonitorLogs(lines: number = 50): Promise<string> {
  const script = `
cd /workspace/host/var/www/retakt

if [ ! -f logs/ai-monitor.log ]; then
  echo "Monitor log not found."
  exit 1
fi

tail -n ${lines} logs/ai-monitor.log
`;

  const result = await executeTerminalCommand(script, 10);
  return result;
}
