# Shared Live Terminal

A persistent, server-side PTY session with WebSocket streaming. All authenticated users can watch live output; only admins can type.

## Architecture

```
terminal/
├── server.js              # Main WebSocket + PTY server (port 3003)
├── scripts/               # Custom command scripts
│   ├── system/           # System monitoring scripts
│   ├── status/           # Status API integration scripts
│   └── ai/               # AI service monitoring scripts
├── lib/                  # Shared utilities (colors, http-check, logger)
├── config/               # Configuration files
└── README.md             # This file
```

## Quick Start

### 1. Start the Terminal Server

```bash
npm run terminal-server
```

The server will start on port 3003 (configurable via `TERMINAL_PORT` env var).

### 2. Access the Terminal

1. Navigate to `/terminal` in your browser
2. Enter the password (default: `admin123`, configurable via `TERMINAL_PASSWORD` env var)
3. Start typing commands!

## Custom Commands

Custom commands are intercepted before being sent to the PTY and execute bash scripts.

### Available Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `help` | - | Show all available commands |
| `system-status` | `status` | Comprehensive system health check |
| `start-monitor` | - | Start 24/7 background monitoring |
| `stop-monitor` | - | Stop background monitoring |
| `show-monitor` | `monitor` | View monitor status and logs |
| `ai-status` | `ai` | Get AI tools status from API |
| `ai-check <tool>` | - | Check specific AI tool |
| `check-ollama` | - | Check Ollama AI service |
| `check-searxng` | - | Check SearXNG web search |
| `check-all-ai` | - | Check all AI services |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | Clear terminal |
| `Ctrl+D` | Logout |
| `Ctrl+C` | Interrupt current process |
| `Arrow Up/Down` | Navigate command history |
| `Tab` | Send tab to shell |

## Adding New Custom Commands

### 1. Create a Bash Script

Create your script in the appropriate directory:

```bash
# System monitoring script
terminal/scripts/system/my-script.sh

# Status check script
terminal/scripts/status/my-script.sh

# AI service script
terminal/scripts/ai/my-script.sh
```

**Script Template:**

```bash
#!/bin/bash
# Script Description
# Additional info about what this script does

echo "Starting my custom command..."

# Your script logic here

exit 0
```

**Important:**
- Add shebang: `#!/bin/bash`
- Make executable: `chmod +x terminal/scripts/*/my-script.sh`
- Use ANSI colors for better output (see `terminal/lib/colors.sh`)
- Exit with appropriate code (0 = success, non-zero = error)

### 2. Register the Command

Edit `terminal/server.js` and add your command to `CUSTOM_COMMANDS`:

```javascript
const CUSTOM_COMMANDS = {
  // ... existing commands
  "my-command": "scripts/system/my-script.sh",
};
```

### 3. Add an Alias (Optional)

```javascript
const COMMAND_ALIASES = {
  // ... existing aliases
  "mc": "my-command",
};
```

### 4. Update Help Text

Edit the `help` command in `executeCustomCommand()` to include your new command:

```javascript
\x1b[1;33mMy Commands:\x1b[0m
  my-command        Description of my command
```

### 5. Restart the Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run terminal-server
```

### 6. Test Your Command

```bash
# In the terminal
my-command
# Or use the alias
mc
```

## Script Best Practices

### 1. Use ANSI Colors

```bash
# Success (green)
echo "\x1b[1;32m✓ Success message\x1b[0m"

# Error (red)
echo "\x1b[1;31m✗ Error message\x1b[0m"

# Warning (yellow)
echo "\x1b[1;33m⚠ Warning message\x1b[0m"

# Info (cyan)
echo "\x1b[1;36mℹ Info message\x1b[0m"
```

### 2. Handle Arguments

```bash
if [ -z "$1" ]; then
  echo "Usage: my-script.sh <argument>"
  exit 1
fi

ARG="$1"
echo "Processing: $ARG"
```

### 3. Check Dependencies

```bash
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required but not installed"
  exit 1
fi
```

### 4. Provide Progress Feedback

```bash
echo "Step 1/3: Checking service..."
# ... do work
echo "Step 2/3: Analyzing results..."
# ... do work
echo "Step 3/3: Generating report..."
# ... do work
echo "✓ Complete!"
```

### 5. Use Timeouts for HTTP Requests

```bash
# Good: with timeout
curl -s --max-time 5 "https://api.example.com"

# Bad: no timeout (can hang forever)
curl -s "https://api.example.com"
```

## Shared Utilities

Use shared utilities from `terminal/lib/`:

### Colors (`terminal/lib/colors.sh`)

```bash
source "$(dirname "$0")/../../lib/colors.sh"

echo "${GREEN}Success${RESET}"
echo "${RED}Error${RESET}"
echo "${YELLOW}Warning${RESET}"
```

### HTTP Check (`terminal/lib/http-check.sh`)

```bash
source "$(dirname "$0")/../../lib/http-check.sh"

check_http "Service Name" "https://api.example.com" 5
```

### Logger (`terminal/lib/logger.sh`)

```bash
source "$(dirname "$0")/../../lib/logger.sh"

log_info "Starting process..."
log_success "Process completed"
log_error "Process failed"
log_warning "Process had warnings"
```

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Terminal server port
TERMINAL_PORT=3003

# Terminal password (admin access)
TERMINAL_PASSWORD=your-secure-password

# CORS origin (default: *)
TERMINAL_CORS_ORIGIN=http://localhost:5173
```

### Service Configuration

Edit `terminal/config/services.json` to configure monitored services:

```json
{
  "services": [
    {
      "name": "My Service",
      "url": "https://api.example.com/health",
      "timeout": 5
    }
  ]
}
```

### Monitor Configuration

Edit `terminal/config/monitor.conf` to configure background monitoring:

```bash
# Monitoring interval (seconds)
MONITOR_INTERVAL=30

# Log file path
MONITOR_LOG_PATH=/workspace/host/var/www/retakt/logs/ai-monitor.log

# Max log lines to keep
MONITOR_MAX_LINES=2000
```

## Security

### Script Path Validation

The server validates all script paths to prevent directory traversal attacks:

```javascript
// Only scripts in terminal/scripts/ are allowed
const scriptsDir = path.join(__dirname, "scripts");
const resolvedPath = path.resolve(scriptPath);

if (!resolvedPath.startsWith(scriptsDir)) {
  // Reject the request
}
```

### Password Authentication

- Password is sent via WebSocket query parameter
- Server validates password before granting access
- Failed authentication closes the connection
- No JWT or session tokens required

### Role-Based Access

- Only admin role can send input to the PTY
- Non-admin users can only watch (read-only)
- Admin commands (clear, reset) are restricted

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3003
netstat -ano | findstr :3003

# Kill the process (Windows)
taskkill //F //PID <PID>

# Kill the process (Linux/Mac)
kill -9 <PID>
```

### Scripts Not Executing

1. Check script is executable: `ls -la terminal/scripts/**/*.sh`
2. Make executable: `chmod +x terminal/scripts/**/*.sh`
3. Verify shebang: `#!/bin/bash`
4. Check server logs for errors

### ANSI Colors Not Showing

1. Verify xterm.js is initialized
2. Check terminal theme configuration
3. Ensure scripts output ANSI escape codes
4. Test with: `echo -e "\x1b[1;32mGreen\x1b[0m"`

### WebSocket Connection Failed

1. Verify server is running: `npm run terminal-server`
2. Check server logs for errors
3. Verify password is correct
4. Check browser console for WebSocket errors
5. Verify CORS settings in `.env.local`

## Development

### Running in Development

```bash
# Terminal 1: Start the terminal server
npm run terminal-server

# Terminal 2: Start the frontend dev server
npm run dev

# Terminal 3: Watch for changes (optional)
npm run test:watch
```

### Testing Custom Commands

1. Create a test script in `terminal/scripts/`
2. Register it in `server.js`
3. Restart the server
4. Test in the browser terminal
5. Check server logs for errors

### Debugging

Enable debug logging in `server.js`:

```javascript
const DEBUG = true;

if (DEBUG) {
  console.log("[Debug] Command:", command);
  console.log("[Debug] Args:", args);
  console.log("[Debug] Script path:", scriptPath);
}
```

## Migration from simple-terminal

The shared-terminal replaces the old simple-terminal implementation:

### Key Differences

| Feature | simple-terminal | shared-terminal |
|---------|----------------|-----------------|
| Backend | Open Terminal API | node-pty + WebSocket |
| Terminal | Custom React component | xterm.js |
| Colors | Custom parsing | Native ANSI support |
| Session | Per-user | Shared persistent PTY |
| Scripts | Embedded in TypeScript | Separate bash files |
| Organization | Flat structure | Organized folders |

### Migration Checklist

- [x] Extract bash scripts from `src/lib/terminal.ts`
- [x] Organize scripts into folders
- [x] Create custom command handlers
- [x] Add command aliases
- [x] Implement keyboard shortcuts
- [x] Test all commands
- [ ] Deprecate simple-terminal
- [ ] Update documentation
- [ ] Remove old code

## Contributing

When adding new features:

1. Create a feature branch
2. Add your script to the appropriate folder
3. Register the command in `server.js`
4. Update this README
5. Add tests to `TEST_COMMANDS.md`
6. Submit a pull request

## License

MIT

