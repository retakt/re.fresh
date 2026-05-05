/**
 * Open Terminal API Client
 * Connects to a real backend terminal service for executing commands
 */

const TERMINAL_URL = import.meta.env.VITE_OPEN_TERMINAL_URL ?? 'http://localhost:8001';
const TERMINAL_API_KEY = import.meta.env.VITE_OPEN_TERMINAL_API_KEY ?? '';

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
 * Execute system status monitoring - minimal clean version
 */
export async function executeSystemStatusCheck(): Promise<string> {
  const script = `
echo "=== Connection status ($(hostname)) ==="
echo "$(date '+%H:%M:%S')"
echo ""

# Function to check service with timing
check_service() {
    local name="$1"
    local url="$2"
    local timeout="$3"
    
    printf "● %-20s" "$name"
    
    start_time=$(date +%s%3N)
    if curl -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [ "$response_time" -lt 200 ]; then
            printf "READY  %3dms\\n" "$response_time"
        elif [ "$response_time" -lt 1000 ]; then
            printf "SLOW   %3dms\\n" "$response_time"
        else
            printf "SLOW   %3dms\\n" "$response_time"
        fi
    else
        printf "DOWN\\n"
    fi
}

# Check services
check_service "AI Model" "https://chat-api.retakt.cc/api/tags" 4
check_service "Web Search" "https://search-api.retakt.cc/search?q=test&format=json" 4
check_service "Weather API" "https://wttr.in/test?format=j1" 6
check_service "Exchange API" "https://open.er-api.com/v6/latest/USD" 6
check_service "YouTube API" "https://yt.retakt.cc/api/health" 4
`;

  const result = await executeTerminalCommand(script, 20);
  return result;
}

/**
 * Start the 24/7 background monitor
 */
export async function startBackgroundMonitor(): Promise<string> {
  const isLocal = TERMINAL_URL.includes('localhost');
  
  if (isLocal) {
    const result = await executeTerminalCommand('./scripts/start-monitor.sh', 10);
    return result;
  } else {
    const result = await executeTerminalCommand('/var/www/yt-downloader/backend/scripts/start-monitor.sh', 10);
    return result;
  }
}

/**
 * Stop the 24/7 background monitor
 */
export async function stopBackgroundMonitor(): Promise<string> {
  const isLocal = TERMINAL_URL.includes('localhost');
  
  if (isLocal) {
    const result = await executeTerminalCommand('./scripts/stop-monitor.sh', 10);
    return result;
  } else {
    const result = await executeTerminalCommand('/var/www/yt-downloader/backend/scripts/stop-monitor.sh', 10);
    return result;
  }
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
