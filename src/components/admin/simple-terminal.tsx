import { Coffee, Square, Send, Shield } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { executeSystemStatusCheck, checkTerminalHealth, setTerminalKey, getTerminalKey, clearTerminalKey } from '@/lib/terminal';
import { useAuthContext } from '@/components/providers/auth';
import { supabase } from '@/lib/supabase';

interface SimpleTerminalProps {
  className?: string;
}

export function SimpleTerminal({ className }: SimpleTerminalProps) {
  const { user, profile } = useAuthContext();
  const [output, setOutput] = useState<string[]>([
    're.Terminal',
    'commands:-',
    '--help',
  ]);
  const [input, setInput] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [terminalAvailable, setTerminalAvailable] = useState<boolean | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalKeyApproved, setTerminalKeyApproved] = useState(true); // Always approved
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-approve terminal access - no auth needed
  useEffect(() => {
    setTerminalKeyApproved(true);
    checkTerminalHealth().then(setTerminalAvailable).catch(() => setTerminalAvailable(false));
  }, []);

  // Check if Open Terminal backend is available
  useEffect(() => {
    if (terminalKeyApproved) {
      checkTerminalHealth().then(setTerminalAvailable).catch(() => setTerminalAvailable(false));
    }
  }, [terminalKeyApproved]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Auto-focus input when not monitoring
  useEffect(() => {
    if (!isMonitoring && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMonitoring]);

  // REAL monitoring function using backend terminal
  const runRealCheck = useCallback(async () => {
    try {
      // Execute the real bash script on the backend
      const result = await executeSystemStatusCheck();
      
      // Parse output into lines - handle both \n and \r\n
      const lines = result.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length === 0) {
        setOutput(prev => [...prev, 'No output received']);
      } else {
        // Get current time and hostname
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Append to history (not replace)
        setOutput(prev => [
          ...prev,
          '',
          `${date} ${time} | my-terminal`,
          '',
          ...lines,
        ]);
      }
    } catch (error) {
      console.error('Error executing system status:', error);
      setOutput(prev => [
        ...prev,
        '',
        'ERROR: Backend connection failed',
        `${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) {
      console.log('Already monitoring, skipping start');
      return;
    }
    
    if (terminalAvailable === false) {
      setOutput(prev => [
        ...prev,
        'ERROR: Open Terminal backend is not available',
        'Please start the Open Terminal service first.',
      ]);
      return;
    }
    
    console.log('Starting monitoring...');
    setIsMonitoring(true);
    setOutput(prev => [...prev, '$ system-status', 'Starting monitoring...']);
    
    // Initial check
    runRealCheck();
    
    // Set up interval for continuous monitoring every 10 seconds
    const id = setInterval(() => {
      console.log('Interval fired - running check');
      runRealCheck();
    }, 10000); // Every 10 seconds
    
    console.log('Interval ID:', id);
    setIntervalId(id);
  }, [runRealCheck, isMonitoring, terminalAvailable]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setOutput(prev => [...prev, '', 'Monitoring stopped. Type "system-status" to restart.']);
  }, [intervalId]);

  // Execute any command on the backend
  const executeCommand = useCallback(async (cmd: string) => {
    try {
      const { executeTerminalCommand } = await import('@/lib/terminal');
      const result = await executeTerminalCommand(cmd, 30);
      
      // If we got empty result, show nothing (command had no output)
      if (!result || result.trim() === '') {
        setOutput(prev => [...prev, '']); // Just add empty line
        return;
      }
      
      // Parse output into lines
      const lines = result.split(/\r?\n/);
      setOutput(prev => [...prev, ...lines]);
    } catch (error) {
      console.error('Error executing command:', error);
      setOutput(prev => [
        ...prev,
        `ERROR: ${error instanceof Error ? error.message : 'Command execution failed'}`,
      ]);
    }
  }, []);

  // Handle command submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    
    if (!cmd) return;
    
    // Add to command history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    setOutput(prev => [...prev, `$ ${input}`]);
    setInput('');
    
    // Special commands that work without auth
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setOutput(['Terminal ready - Full access enabled']);
      return;
    }
    
    if (cmd.toLowerCase() === 'help') {
      setOutput(prev => [...prev, 
        'Available commands:',
        '',
        '  system-status  - Check backend services via Open Terminal',
        '  docker ps      - List running containers',
        '  whoami         - Show current user',
        '  pwd            - Show current directory',
        '  ls -la [path]  - List files (use full paths)',
        '  cat <file>     - View file contents',
        '  clear          - Clear terminal',
        '  help           - Show this help',
        '',
        'Important: Each command runs independently!',
        '  • Use full paths: /workspace/host/var/www/retakt/',
        '  • cd does NOT persist between commands',
        '  • Combine commands: cd /path && ls -la',
        '',
        'Your server files are at:',
        '  /workspace/host/var/www/retakt/',
        '',
        'Examples:',
        '  ls -la /workspace/host/var/www/retakt/',
        '  cd /workspace/host/var/www/retakt && ls -la',
        '  cat /workspace/host/var/www/retakt/index.html',
        '',
        'Full access - No restrictions!'
      ]);
      return;
    }

    // Check if terminal key is approved for other commands - ALWAYS TRUE NOW
    // All commands work without approval
    
    // Special commands
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setOutput(['Terminal ready']);
    } else if (cmd.toLowerCase() === 'system-status' || cmd.toLowerCase() === 'status') {
      // Use the built-in status check function
      import('@/lib/terminal').then(({ executeSystemStatusCheck }) => {
        return executeSystemStatusCheck();
      }).then(result => {
        const lines = result.split(/\r?\n/);
        setOutput(prev => [...prev, ...lines]);
        
        // Start continuous monitoring every 30 seconds
        if (!isMonitoring) {
          setIsMonitoring(true);
          const id = setInterval(() => {
            import('@/lib/terminal').then(({ executeSystemStatusCheck }) => {
              return executeSystemStatusCheck();
            }).then(result => {
              const lines = result.split(/\r?\n/);
              setOutput(prev => [...prev, '', '--- Refresh ---', ...lines]);
            }).catch(error => {
              setOutput(prev => [...prev, `ERROR: ${error.message}`]);
            });
          }, 30000); // Every 30 seconds
          setIntervalId(id);
        }
      }).catch(error => {
        setOutput(prev => [...prev, `ERROR: ${error.message}`]);
      });
    } else if (cmd.toLowerCase() === 'ai-status' || cmd.toLowerCase() === 'ai-tools') {
      // Check AI tools status via local API
      import('@/lib/terminal').then(({ getAIToolsStatus }) => {
        return getAIToolsStatus();
      }).then(result => {
        const lines = result.split(/\r?\n/);
        setOutput(prev => [...prev, ...lines]);
      }).catch(error => {
        setOutput(prev => [...prev, `ERROR: ${error.message}`]);
      });
    } else if (cmd.toLowerCase().startsWith('ai-check ')) {
      // Check specific AI tool
      const toolName = cmd.substring(9).trim();
      if (toolName) {
        import('@/lib/terminal').then(({ checkSpecificAITool }) => {
          return checkSpecificAITool(toolName);
        }).then(result => {
          const lines = result.split(/\r?\n/);
          setOutput(prev => [...prev, ...lines]);
        }).catch(error => {
          setOutput(prev => [...prev, `ERROR: ${error.message}`]);
        });
      } else {
        setOutput(prev => [...prev, 'Usage: ai-check <tool-name>']);
      }
    } else if (cmd.toLowerCase() === 'help') {
      setOutput(prev => [...prev, 
        'Available commands:',
        '',
        '  system-status  - Check backend services via Open Terminal',
        '  ai-status      - Check AI tools via Status API (requires API running)',
        '  ai-check <tool> - Check specific AI tool (requires API running)',
        '  start-monitor  - Start background monitoring (logs to logs/ai-monitor.log)',
        '  stop-monitor   - Stop background monitoring',
        '  show-monitor   - Show monitor status and recent logs',
        '  start-api      - Start Status API server on port 3002',
        '  stop-api       - Stop Status API server',
        '  docker ps      - List running containers',
        '  whoami         - Show current user',
        '  ls -la         - List files',
        '  clear          - Clear terminal',
        '  help           - Show this help',
        '',
        'Full access - No restrictions!',
        '',
        'Monitored Services:',
        '  • AI Model (Ollama) - https://chat-api.retakt.cc',
        '  • Web Search (SearXNG) - https://search-api.retakt.cc',
        '  • Weather API - https://wttr.in',
        '  • Exchange Rate API - https://open.er-api.com',
        '  • YouTube Backend - https://yt.retakt.cc',
        '  • Open Terminal - https://tmux.retakt.cc',
        '',
        'Workflow:',
        '  1. start-monitor           (starts logging every 30s)',
        '  2. start-api               (starts HTTP API on port 3002)',
        '  3. Ask AI: "what are the pings?" (AI fetches from API)'
      ]);
    } else if (cmd.toLowerCase() === 'start-monitor') {
      import('@/lib/terminal').then(({ startBackgroundMonitor }) => {
        return startBackgroundMonitor();
      }).then(result => {
        const lines = result.split(/\r?\n/);
        setOutput(prev => [...prev, ...lines]);
      }).catch(error => {
        setOutput(prev => [...prev, `ERROR: ${error.message}`]);
      });
    } else if (cmd.toLowerCase() === 'stop-monitor') {
      import('@/lib/terminal').then(({ stopBackgroundMonitor }) => {
        return stopBackgroundMonitor();
      }).then(result => {
        const lines = result.split(/\r?\n/);
        setOutput(prev => [...prev, ...lines]);
      }).catch(error => {
        setOutput(prev => [...prev, `ERROR: ${error.message}`]);
      });
    } else if (cmd.toLowerCase() === 'show-monitor') {
      import('@/lib/terminal').then(({ showMonitorStatus }) => {
        return showMonitorStatus();
      }).then(result => {
        const lines = result.split(/\r?\n/);
        setOutput(prev => [...prev, ...lines]);
      }).catch(error => {
        setOutput(prev => [...prev, `ERROR: ${error.message}`]);
      });
    } else if (cmd.toLowerCase() === 'start-api') {
      executeCommand('cd /workspace/host/var/www/retakt/status-api && mkdir -p logs && npm install && nohup node server.js > logs/status-api.log 2>&1 & echo $! > logs/status-api.pid && echo "Status API started on port 3002" && sleep 1 && cat logs/status-api.pid');
    } else if (cmd.toLowerCase() === 'stop-api') {
      executeCommand('cd /workspace/host/var/www/retakt/status-api && if [ -f logs/status-api.pid ]; then kill $(cat logs/status-api.pid) && rm logs/status-api.pid && echo "Status API stopped"; else echo "Status API is not running"; fi');
    } else {
      // Execute any other command on the backend
      executeCommand(cmd);
    }
  }, [input, startMonitoring, executeCommand, terminalKeyApproved, user]);

  // Handle keyboard navigation for command history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      const newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
      
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0 || historyIndex === -1) return;
      
      const newIndex = historyIndex + 1;
      
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  }, [commandHistory, historyIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <div className={`w-full h-full flex flex-col rounded-lg shadow-lg font-mono text-[10px] xs:text-[11px] sm:text-xs bg-amber-950/10 backdrop-blur-sm text-teal-300 border border-amber-400/10 ${className}`}>
      {/* Header with glowing coffee mug - optimized for mobile */}
      <div className="p-1.5 sm:p-2 rounded-t-md flex items-center justify-between border-b bg-amber-900/15 backdrop-blur-sm border-yellow-600/60 shadow-[0_2px_10px_rgba(202,138,4,0.2)]">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Coffee mug with conditional glow */}
          <div className="relative">
            {isMonitoring && (
              <span className="absolute inset-0 animate-ping">
                <Coffee className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-400 opacity-75" />
              </span>
            )}
            <Coffee 
              className={`h-2.5 w-2.5 sm:h-3 sm:w-3 relative transition-all duration-300 ${
                isMonitoring 
                  ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' 
                  : 'text-amber-400'
              }`} 
            />
          </div>
          <span className="flex items-center gap-1">
            <span className="opacity-80 text-[10px] sm:text-xs text-yellow-400">Terminal</span>
            {terminalKeyApproved && (
              <div className="relative">
                <div className="w-1 h-1 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                <div className="absolute inset-0 w-1 h-1 rounded-full bg-green-400 animate-pulse opacity-60 shadow-[0_0_12px_rgba(74,222,128,1)]"></div>
              </div>
            )}
          </span>
        </div>
        <div className="flex gap-1">
          {isMonitoring && (
            <button
              onClick={stopMonitoring}
              className="p-0.5 sm:p-1 rounded text-[10px] sm:text-xs flex items-center gap-1 transition-colors hover:bg-amber-800/30"
              title="Stop monitoring"
              type="button"
            >
              <Square className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output - optimized for mobile with better touch scrolling */}
      <div
        ref={outputRef}
        className="flex-1 p-1.5 sm:p-2 overflow-y-auto bg-transparent touch-pan-y overscroll-contain scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {output.map((line, index) => {
          let lineClass = "whitespace-pre-wrap mb-0.5 leading-tight break-words";
          
          // Enhanced color coding with more variety
          if (line.includes('READY')) {
            // Extract response time if present
            const timeMatch = line.match(/(\d+)ms/);
            if (timeMatch) {
              const ms = parseInt(timeMatch[1]);
              
              // More vibrant color gradients based on response time
              if (ms < 50) {
                lineClass += " text-emerald-400"; // Excellent - bright emerald
              } else if (ms < 100) {
                lineClass += " text-green-400"; // Very good - bright green
              } else if (ms < 200) {
                lineClass += " text-lime-400"; // Good - bright lime
              } else if (ms < 500) {
                lineClass += " text-yellow-400"; // Acceptable - bright yellow
              } else if (ms < 1000) {
                lineClass += " text-orange-400"; // Getting slow - bright orange
              } else if (ms < 2000) {
                lineClass += " text-red-400"; // Slow - bright red
              } else {
                lineClass += " text-rose-400"; // Very slow - bright rose
              }
            } else {
              lineClass += " text-green-400"; // Default bright green for READY
            }
          } else if (line.includes('SLOW')) {
            // Extract response time for SLOW status
            const timeMatch = line.match(/(\d+)ms/);
            if (timeMatch) {
              const ms = parseInt(timeMatch[1]);
              if (ms < 1000) {
                lineClass += " text-orange-400"; // Bright orange for < 1s
              } else if (ms < 2000) {
                lineClass += " text-red-400"; // Bright red for 1-2s
              } else {
                lineClass += " text-rose-400"; // Bright rose for > 2s
              }
            } else {
              lineClass += " text-orange-400"; // Default bright orange for SLOW
            }
          } else if (line.includes('DOWN') || line.includes('ERROR') || line.includes('failed')) {
            lineClass += " text-red-400"; // Bright red for errors
          } else if (line.includes('not found') || line.includes('NOT STARTED')) {
            lineClass += " text-rose-300"; // Light rose for not found/not started
          } else if (line.includes('Monitoring stopped') || line.includes('started') || line.includes('stopped')) {
            lineClass += " text-purple-400"; // Bright purple for status messages
          } else if (line.includes('Refresh') || line.includes('---') || line.includes('===')) {
            lineClass += " text-slate-400"; // Slate for separators and refresh
          } else if (line.includes('|') || line.includes('Health Check') || line.includes('2026-')) {
            // Timestamp line or separator
            lineClass += " text-sky-400"; // Sky blue for timestamps and health checks
          } else if (line.startsWith('$')) {
            // Command prompt - keep $ cyan, make command text yellow
            lineClass += " text-cyan-400 font-semibold"; // Cyan for $ sign and fallback
          } else if (line.includes('●')) {
            // Service status lines - different colors for different services
            if (line.includes('AI Model') || line.includes('Web Search')) {
              lineClass += " text-indigo-400"; // Indigo for AI services
            } else if (line.includes('Weather') || line.includes('Exchange')) {
              lineClass += " text-amber-400"; // Amber for external APIs
            } else if (line.includes('YouTube') || line.includes('Terminal')) {
              lineClass += " text-pink-400"; // Pink for app services
            } else {
              lineClass += " text-blue-400"; // Default blue for other services
            }
          } else if (line.includes('[') && line.includes(']')) {
            // Category headers like [AI Services] - different colors for each category
            if (line.includes('AI Services')) {
              lineClass += " text-violet-400 font-semibold"; // Violet for AI
            } else if (line.includes('External APIs')) {
              lineClass += " text-fuchsia-400 font-semibold"; // Fuchsia for external
            } else if (line.includes('App Services')) {
              lineClass += " text-rose-400 font-semibold"; // Rose for app services
            } else {
              lineClass += " text-purple-400 font-semibold"; // Default purple for other categories
            }
          } else {
            // Default color - teal for regular text
            lineClass += " text-teal-200";
          }
          
          return (
            <pre key={index} className={lineClass}>
              {line.startsWith('$') ? (
                <>
                  <span className="text-cyan-400 font-semibold">$</span>
                  <span className="text-yellow-400 font-semibold">{line.substring(1)}</span>
                </>
              ) : (
                line
              )}
            </pre>
          );
        })}
      </div>

      {/* Input bar - only show when NOT monitoring, optimized for mobile */}
      {!isMonitoring && (
        <form onSubmit={handleSubmit} className="flex items-center p-1.5 sm:p-2 border-t border-yellow-600/60 shadow-[0_-2px_10px_rgba(202,138,4,0.2)] bg-amber-900/10 backdrop-blur-sm">
          <span className="mr-1.5 sm:mr-2 text-cyan-400 text-xs sm:text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent focus:outline-none text-yellow-400 placeholder-yellow-600 text-xs sm:text-sm min-w-0 py-0.5"
            placeholder="Enter command..."
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="ml-1.5 sm:ml-2 p-1 sm:p-1.5 rounded-full transition-colors hover:bg-amber-800/30 active:bg-amber-800/50"
            title="Execute command"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
