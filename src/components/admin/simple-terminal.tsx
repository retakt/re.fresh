import { Coffee, Square, Send } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { executeSystemStatusCheck, checkTerminalHealth } from '@/lib/terminal';

interface SimpleTerminalProps {
  className?: string;
}

export function SimpleTerminal({ className }: SimpleTerminalProps) {
  const [output, setOutput] = useState<string[]>([
    'Terminal ready',
    'Type "help" for available commands.',
    'Try: ai-status, system-status, ai-check <tool>',
  ]);
  const [input, setInput] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [terminalAvailable, setTerminalAvailable] = useState<boolean | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if Open Terminal backend is available
  useEffect(() => {
    checkTerminalHealth().then(setTerminalAvailable);
  }, []);

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
    
    setOutput(prev => [...prev, `$ ${input}`]);
    setInput('');
    
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
        '  system-status  - Check backend services via Open Terminal',
        '  ai-status      - Check AI tools via local API (persistent)',
        '  ai-check <tool> - Check specific AI tool',
        '  start-monitor  - Start background monitoring script',
        '  stop-monitor   - Stop background monitoring script',
        '  clear          - Clear terminal',
        '  help           - Show this help',
        '',
        'AI Tools: AI Model, Web Search, Weather API, Exchange Rate API, YouTube Backend'
      ]);
    } else if (cmd.toLowerCase() === 'start-monitor') {
      executeCommand('./scripts/start-monitor.sh');
    } else if (cmd.toLowerCase() === 'stop-monitor') {
      executeCommand('./scripts/stop-monitor.sh');
    } else {
      // Execute any other command on the backend
      executeCommand(cmd);
    }
  }, [input, startMonitoring, executeCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <div className={`w-full h-full flex flex-col rounded-lg shadow-lg font-mono text-[10px] xs:text-[11px] sm:text-xs bg-amber-950/30 text-amber-400 ${className}`}>
      {/* Header with glowing coffee mug - optimized for mobile */}
      <div className="p-1.5 sm:p-2 rounded-t-md flex items-center justify-between border-b bg-amber-900/50 border-amber-400/20">
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
            <span className="opacity-80 text-[10px] sm:text-xs">Terminal</span>
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
        className="flex-1 p-1.5 sm:p-2 overflow-y-auto bg-transparent touch-pan-y overscroll-contain"
        style={{ 
          scrollbarWidth: 'thin',
          msOverflowStyle: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style>{`
          @media (min-width: 640px) {
            div::-webkit-scrollbar {
              width: 4px;
            }
            div::-webkit-scrollbar-track {
              background: #000;
            }
            div::-webkit-scrollbar-thumb {
              background: #78350f;
              border-radius: 2px;
            }
          }
          @media (max-width: 639px) {
            div::-webkit-scrollbar {
              width: 2px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: #78350f80;
              border-radius: 1px;
            }
          }
        `}</style>
        {output.map((line, index) => {
          let lineClass = "whitespace-pre-wrap mb-0.5 leading-tight break-words";
          
          // Color coding based on content and response times
          if (line.includes('READY')) {
            // Extract response time if present
            const timeMatch = line.match(/(\d+)ms/);
            if (timeMatch) {
              const ms = parseInt(timeMatch[1]);
              
              // Different thresholds for different services
              if (line.includes('AI Model') || line.includes('Web Search')) {
                // Local services - should be fast
                if (ms < 200) {
                  lineClass += " text-green-400"; // Excellent
                } else if (ms < 500) {
                  lineClass += " text-yellow-400"; // Acceptable
                } else {
                  lineClass += " text-orange-400"; // Slow
                }
              } else if (line.includes('Weather') || line.includes('Exchange')) {
                // External APIs - more lenient
                if (ms < 500) {
                  lineClass += " text-green-400"; // Excellent
                } else if (ms < 1500) {
                  lineClass += " text-yellow-400"; // Acceptable
                } else {
                  lineClass += " text-orange-400"; // Slow
                }
              }
            } else {
              lineClass += " text-green-400"; // Default green for READY
            }
          } else if (line.includes('SLOW')) {
            lineClass += " text-yellow-400";
          } else if (line.includes('DOWN') || line.includes('ERROR')) {
            lineClass += " text-red-400";
          } else if (line.includes('|')) {
            // Timestamp line
            lineClass += " text-amber-400 opacity-70";
          } else if (line.startsWith('$')) {
            // Command prompt
            lineClass += " text-cyan-400";
          } else {
            // Default color
            lineClass += " text-amber-300";
          }
          
          return (
            <pre key={index} className={lineClass}>
              {line}
            </pre>
          );
        })}
      </div>

      {/* Input bar - only show when NOT monitoring, optimized for mobile */}
      {!isMonitoring && (
        <form onSubmit={handleSubmit} className="flex items-center p-1.5 sm:p-2 border-t border-amber-400/20 bg-amber-900/30">
          <span className="mr-1 sm:mr-2 text-cyan-400 text-[10px] sm:text-xs">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-amber-300 placeholder-amber-600 text-[10px] sm:text-xs min-w-0"
            placeholder="Enter command..."
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="ml-1 sm:ml-2 p-0.5 sm:p-1 rounded-full transition-colors hover:bg-amber-800/30 active:bg-amber-800/50"
            title="Execute command"
          >
            <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        </form>
      )}
    </div>
  );
}
