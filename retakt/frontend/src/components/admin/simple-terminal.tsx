import { Coffee, Square, Send, Shield } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { executeSystemStatusCheck, checkTerminalHealth, setTerminalKey, getTerminalKey, clearTerminalKey } from '@/lib/terminal';
import { useAuthContext } from '@/components/providers/auth';
import { supabase } from '@/lib/supabase';

/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * Please use the new SharedTerminal component at /terminal instead.
 * 
 * Migration path:
 * - Navigate to /terminal in your app
 * - All commands from simple-terminal are available in shared-terminal
 * - New features: persistent PTY session, real-time collaboration, better ANSI support
 * 
 * See: src/components/terminal/shared-terminal.tsx
 */

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
  const [currentWorkingDir, setCurrentWorkingDir] = useState<string>(''); // Persistent cwd state
  const [isCommandRunning, setIsCommandRunning] = useState(false); // Command execution state
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper function to clean ANSI escape codes from terminal output
  const cleanAnsiCodes = useCallback((text: string): string => {
    return text
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI escape sequences
      .replace(/\x1b\[[0-9]*[GK]/g, '')     // Remove cursor positioning codes  
      .replace(/\r/g, '')                    // Remove carriage returns
      .trim();
  }, []);

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

  // Auto-focus input when not monitoring and after commands complete
  useEffect(() => {
    if (!isMonitoring && !isCommandRunning && inputRef.current) {
      // Small delay to ensure DOM updates are complete
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMonitoring, isCommandRunning]);

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

  // Execute any command on the backend, prepending cwd if set
  const executeCommand = useCallback(async (cmd: string, overrideCwd?: string, timeoutMs?: number) => {
    if (isCommandRunning) {
      setOutput(prev => [...prev, 'Command already running. Please wait or refresh the page.']);
      return;
    }

    setIsCommandRunning(true);

    try {
      const { executeTerminalCommand } = await import('@/lib/terminal');
      const cwd = overrideCwd !== undefined ? overrideCwd : currentWorkingDir;
      const fullCmd = cwd ? `cd "${cwd}" && ${cmd}` : cmd;
      
      // Use backend timeout only, no frontend timeout unless specified
      const backendTimeout = timeoutMs ? Math.min(timeoutMs / 1000, 300) : 300; // Default 5min max
      const result = await executeTerminalCommand(fullCmd, backendTimeout);
      
      setIsCommandRunning(false);
      
      // Restore focus after command completes
      setTimeout(() => {
        if (inputRef.current && !isMonitoring) {
          inputRef.current.focus();
        }
      }, 50);
      
      // If we got empty result, show nothing (command had no output)
      if (!result || result.trim() === '') {
        setOutput(prev => [...prev, '']); // Just add empty line
        return;
      }
      
      // Parse output into lines, limit to prevent UI freeze
      const lines = result.split(/\r?\n/).slice(0, 1000); // Max 1000 lines
      if (result.split(/\r?\n/).length > 1000) {
        lines.push('... (output truncated, use "tail" or redirect to file for full output)');
      }
      
      // Clean ANSI escape codes from output
      const cleanedLines = lines.map(line => cleanAnsiCodes(line)).filter(line => line.length > 0);
      
      setOutput(prev => [...prev, ...cleanedLines]);
    } catch (error) {
      setIsCommandRunning(false);
      
      // Restore focus after error
      setTimeout(() => {
        if (inputRef.current && !isMonitoring) {
          inputRef.current.focus();
        }
      }, 50);
      
      console.error('Error executing command:', error);
      setOutput(prev => [
        ...prev,
        `ERROR: ${error instanceof Error ? error.message : 'Command execution failed'}`,
      ]);
    }
  }, [currentWorkingDir, isCommandRunning]);

  // Handle command submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    
    if (!cmd) return;
    
    // Single command - execute normally
    // Add to command history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    setOutput(prev => [...prev, `$ ${input}`]);
    setInput('');
    
    // Special commands that work without auth
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setOutput(['Terminal ready - Full access enabled']);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // Handle cd — update cwd state, resolve relative paths on backend
    if (cmd === 'cd' || cmd.toLowerCase() === 'cd ~') {
      // cd with no args or cd ~ → go to home
      import('@/lib/terminal').then(({ executeTerminalCommand }) => {
        const base = currentWorkingDir ? `cd "${currentWorkingDir}" && ` : '';
        return executeTerminalCommand(`${base}cd ${cmd === 'cd' ? '' : '~'} && pwd`, 10);
      }).then(result => {
        const newDir = result.trim().split('\n').pop()?.trim() ?? '';
        const cleanDir = cleanAnsiCodes(newDir);
        if (cleanDir && !cleanDir.includes('No such file')) {
          setCurrentWorkingDir(cleanDir);
          setOutput(prev => [...prev, cleanDir]);
        }
        // Restore focus
        setTimeout(() => inputRef.current?.focus(), 50);
      }).catch(error => {
        setOutput(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : 'cd failed'}`]);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
      return;
    }

    if (cmd.startsWith('cd ')) {
      const target = cmd.slice(3).trim();
      
      // Special case for "cd host" - shortcut to /workspace/host
      if (target === 'host') {
        setCurrentWorkingDir('/workspace/host');
        setOutput(prev => [...prev, '/workspace/host']);
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      
      // Properly escape the target path
      const escapedTarget = target.replace(/'/g, "'\"'\"'");
      import('@/lib/terminal').then(({ executeTerminalCommand }) => {
        const base = currentWorkingDir ? `cd "${currentWorkingDir}" && ` : '';
        return executeTerminalCommand(`${base}cd '${escapedTarget}' && pwd`, 10);
      }).then(result => {
        const lines = result.trim().split('\n');
        const newDir = lines[lines.length - 1]?.trim() ?? '';
        const cleanDir = cleanAnsiCodes(newDir);
        if (cleanDir && !cleanDir.includes('No such file') && !cleanDir.includes('cd:')) {
          setCurrentWorkingDir(cleanDir);
          setOutput(prev => [...prev, cleanDir]);
        } else {
          // Show the actual error from cd command
          const errorLine = lines.find(line => line.includes('cd:')) || `cd: ${target}: No such file or directory`;
          setOutput(prev => [...prev, cleanAnsiCodes(errorLine)]);
        }
        // Restore focus
        setTimeout(() => inputRef.current?.focus(), 50);
      }).catch(error => {
        setOutput(prev => [...prev, `cd: ${target}: No such file or directory`]);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
      return;
    }

    // Kill running command
    if (cmd.toLowerCase() === 'kill' || cmd.toLowerCase() === 'ctrl+c') {
      setIsCommandRunning(false);
      setOutput(prev => [...prev, '^C (frontend state reset - backend command may still be running)']);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // Quick shortcut to host filesystem root
    if (cmd.toLowerCase() === 'cdhost') {
      setCurrentWorkingDir('/workspace/host');
      setOutput(prev => [...prev, '/workspace/host']);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    if (cmd === 'pwd') {
      if (currentWorkingDir) {
        setOutput(prev => [...prev, currentWorkingDir]);
      } else {
        // Ask backend for actual cwd
        import('@/lib/terminal').then(({ executeTerminalCommand }) => {
          return executeTerminalCommand('pwd', 10);
        }).then(result => {
          const dir = cleanAnsiCodes(result.trim());
          setCurrentWorkingDir(dir);
          setOutput(prev => [...prev, dir]);
        }).catch(error => {
          setOutput(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : 'pwd failed'}`]);
          setTimeout(() => inputRef.current?.focus(), 50);
        });
      }
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
        '  cd <path>      - Change directory (persists across commands)',
        '  cdhost         - Quick jump to host filesystem root',
        '  ls             - List files in current directory',
        '  cat <file>     - View file contents',
        '  kill           - Stop running command',
        '  clear          - Clear terminal',
        '  help           - Show this help',
        '',
        'cd now persists between commands!',
        `  Current directory: ${currentWorkingDir || '(default)'}`,
        '',
        'Navigation shortcuts:',
        '  cd ~           - Go to container home (/root)',
        '  cd /           - Go to container filesystem root',
        '  cd host        - Go to host filesystem (/workspace/host)',
        '  cdhost         - Same as "cd host" (quick shortcut)',
        '  cd /workspace  - Go to workspace (your files)',
        '  cd ..          - Go back one directory',
        '',
        'Your actual server files are at:',
        '  /workspace/host/opt/',
        '  /workspace/host/etc/',
        '  Current project: status-api/, yt/, src/',
        '',
        'Examples:',
        '  cd host                           (jump to host root)',
        '  cdhost                            (same as above)',
        '  cd status-api                     (status API server)',
        '  cd yt/backend                     (YouTube backend)',
        '  ls -la',
        '  cat package.json',
        '',
        'Full access - No restrictions!'
      ]);
      setTimeout(() => inputRef.current?.focus(), 50);
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
      executeCommand('if [ -d "/workspace/host/var/www/retakt/status-api" ]; then cd /workspace/host/var/www/retakt/status-api && mkdir -p logs && npm install && nohup node server.js > logs/status-api.log 2>&1 & echo $! > logs/status-api.pid && echo "Status API started on port 3002" && sleep 1 && cat logs/status-api.pid; else echo "ERROR: Status API not found at /workspace/host/var/www/retakt/status-api"; echo "Run the deploy script first: ./deploy.sh"; echo "Or check if the path exists: ls -la /workspace/host/var/www/retakt/"; fi');
    } else if (cmd.toLowerCase() === 'stop-api') {
      executeCommand('cd /workspace/host/var/www/retakt/status-api && if [ -f logs/status-api.pid ]; then kill $(cat logs/status-api.pid) && rm logs/status-api.pid && echo "Status API stopped"; else echo "Status API is not running"; fi');
    } else {
      // Execute any other command on the backend
      executeCommand(cmd);
    }
  }, [input, startMonitoring, executeCommand, terminalKeyApproved, user, currentWorkingDir]);

  // Handle paste events for multi-line command detection
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if pasted content contains multiple lines or semicolons
    if (pastedText.includes('\n') || pastedText.includes(';')) {
      e.preventDefault(); // Prevent default paste behavior
      
      // Split commands on newlines and semicolons, clean them up
      const commands = pastedText
        .split(/[\n;]+/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (commands.length > 1) {
        // Multiple commands detected - execute them sequentially
        setInput(''); // Clear input field
        
        commands.forEach((command, index) => {
          setTimeout(() => {
            // Add to command history
            setCommandHistory(prev => [...prev, command]);
            setOutput(prev => [...prev, `$ ${command}`]);
            
            // Execute each command with the same logic as handleSubmit
            if (command.toLowerCase() === 'clear' || command.toLowerCase() === 'cls') {
              setOutput(prev => [...prev.slice(0, -1), 'Terminal ready - Full access enabled']);
            } else if (command === 'cd' || command.toLowerCase() === 'cd ~') {
              // Handle cd commands
              import('@/lib/terminal').then(({ executeTerminalCommand }) => {
                const base = currentWorkingDir ? `cd "${currentWorkingDir}" && ` : '';
                return executeTerminalCommand(`${base}cd ${command === 'cd' ? '' : '~'} && pwd`, 10);
              }).then(result => {
                const newDir = result.trim().split('\n').pop()?.trim() ?? '';
                const cleanDir = cleanAnsiCodes(newDir);
                if (cleanDir && !cleanDir.includes('No such file')) {
                  setCurrentWorkingDir(cleanDir);
                  setOutput(prev => [...prev, cleanDir]);
                }
              }).catch(error => {
                setOutput(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : 'cd failed'}`]);
              });
            } else if (command.startsWith('cd ')) {
              const target = command.slice(3).trim();
              if (target === 'host') {
                setCurrentWorkingDir('/workspace/host');
                setOutput(prev => [...prev, '/workspace/host']);
              } else {
                const escapedTarget = target.replace(/'/g, "'\"'\"'");
                import('@/lib/terminal').then(({ executeTerminalCommand }) => {
                  const base = currentWorkingDir ? `cd "${currentWorkingDir}" && ` : '';
                  return executeTerminalCommand(`${base}cd '${escapedTarget}' && pwd`, 10);
                }).then(result => {
                  const lines = result.trim().split('\n');
                  const newDir = lines[lines.length - 1]?.trim() ?? '';
                  const cleanDir = cleanAnsiCodes(newDir);
                  if (cleanDir && !cleanDir.includes('No such file') && !cleanDir.includes('cd:')) {
                    setCurrentWorkingDir(cleanDir);
                    setOutput(prev => [...prev, cleanDir]);
                  } else {
                    const errorLine = lines.find(line => line.includes('cd:')) || `cd: ${target}: No such file or directory`;
                    setOutput(prev => [...prev, cleanAnsiCodes(errorLine)]);
                  }
                }).catch(error => {
                  setOutput(prev => [...prev, `cd: ${target}: No such file or directory`]);
                });
              }
            } else if (command.toLowerCase() === 'cdhost') {
              setCurrentWorkingDir('/workspace/host');
              setOutput(prev => [...prev, '/workspace/host']);
            } else if (command === 'pwd') {
              if (currentWorkingDir) {
                setOutput(prev => [...prev, currentWorkingDir]);
              } else {
                import('@/lib/terminal').then(({ executeTerminalCommand }) => {
                  return executeTerminalCommand('pwd', 10);
                }).then(result => {
                  const dir = cleanAnsiCodes(result.trim());
                  setCurrentWorkingDir(dir);
                  setOutput(prev => [...prev, dir]);
                }).catch(error => {
                  setOutput(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : 'pwd failed'}`]);
                });
              }
            } else {
              // Execute other commands normally
              executeCommand(command);
            }
          }, index * 300); // Slightly longer delay between commands for better visibility
        });
        
        // Restore focus after all commands are queued
        setTimeout(() => {
          if (inputRef.current && !isMonitoring) {
            inputRef.current.focus();
          }
        }, commands.length * 300 + 100);
        
        return; // Don't continue with normal paste behavior
      }
    }
    
    // Single line or no special characters - let default paste behavior happen
    // The input will be updated normally and can be submitted with Enter
  }, [currentWorkingDir, executeCommand, cleanAnsiCodes, isMonitoring]);

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
        onClick={() => {
          if (!isMonitoring && !isCommandRunning && inputRef.current) {
            inputRef.current.focus();
          }
        }}
        className="flex-1 p-1.5 sm:p-2 overflow-y-auto bg-transparent touch-pan-y overscroll-contain scrollbar-hide cursor-text"
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
          <span className="mr-1.5 sm:mr-2 text-cyan-400 text-xs sm:text-sm flex-shrink-0">
            {currentWorkingDir ? (
              <span>
                <span className="text-emerald-400 font-medium">{currentWorkingDir.split('/').pop() || currentWorkingDir}</span>
                <span> $</span>
              </span>
            ) : '$'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isCommandRunning}
            className={`flex-1 bg-transparent focus:outline-none text-yellow-400 placeholder-yellow-600 text-xs sm:text-sm min-w-0 py-0.5 ${
              isCommandRunning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder={isCommandRunning ? "Command running... (type 'kill' to reset UI)" : "Enter command..."}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={isCommandRunning}
            className={`ml-1.5 sm:ml-2 p-1 sm:p-1.5 rounded-full transition-colors ${
              isCommandRunning 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-amber-800/30 active:bg-amber-800/50'
            }`}
            title={isCommandRunning ? "Command running" : "Execute command"}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
