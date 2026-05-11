# Terminal Commands Test Guide

This document provides a comprehensive test plan for all custom commands in the shared live terminal.

## Prerequisites

1. Terminal server running: `npm run terminal-server`
2. Frontend dev server running: `npm run dev`
3. Navigate to `/terminal` in the browser
4. Enter password to authenticate

## Test Plan

### 1. Basic Commands

#### Test: help
```bash
help
```
**Expected:** Display list of all available custom commands with descriptions

#### Test: clear (Ctrl+L)
```bash
# Type some commands first, then:
clear
# Or press Ctrl+L
```
**Expected:** Terminal screen clears

#### Test: logout (Ctrl+D)
```bash
logout
# Or press Ctrl+D
```
**Expected:** Return to password prompt

---

### 2. System Monitoring Commands

#### Test: system-status (alias: status)
```bash
system-status
# Or use alias:
status
```
**Expected:**
- System health check header
- Service health status (AI services, External APIs, App services)
- System resources (memory, disk, load average, processes)
- Network diagnostics (DNS, internet connectivity)
- Colored output with ANSI codes

#### Test: start-monitor
```bash
start-monitor
```
**Expected:**
- Message: "Monitor started successfully (PID: XXXX)"
- Instructions to use 'show-monitor' to view logs

#### Test: show-monitor (alias: monitor)
```bash
show-monitor
# Or use alias:
monitor
```
**Expected:**
- Monitor status (RUNNING/STOPPED)
- Recent logs (last 30 lines)

#### Test: stop-monitor
```bash
stop-monitor
```
**Expected:**
- Message: "✓ Monitor stopped (PID: XXXX)"

---

### 3. AI Status Commands

#### Test: ai-status (alias: ai)
```bash
ai-status
# Or use alias:
ai
```
**Expected:**
- AI Tools Status header with timestamp
- List of services with status and response times
- Health summary (X/Y services operational)

#### Test: ai-check <tool>
```bash
ai-check ollama
```
**Expected:**
- Tool status with response time
- Operational/Down indicator

---

### 4. AI Service Checks

#### Test: check-ollama
```bash
check-ollama
```
**Expected:**
- "Checking Ollama AI Service..."
- Operational status with response time
- HTTP status code
- Available models count (if jq is installed)

#### Test: check-searxng
```bash
check-searxng
```
**Expected:**
- "Checking SearXNG Web Search Service..."
- Operational status with response time
- HTTP status code
- Test search result count (if jq is installed)

#### Test: check-all-ai
```bash
check-all-ai
```
**Expected:**
- Header: "AI SERVICES HEALTH CHECK"
- Check results for each service
- Summary with total/operational/down counts

---

### 5. Standard Shell Commands

All standard Unix/PowerShell commands should work:

```bash
pwd
ls
cd /path/to/directory
cat file.txt
echo "Hello World"
```

**Expected:** Normal shell behavior

---

### 6. Command History

#### Test: Arrow Up/Down
1. Type several commands
2. Press Arrow Up
3. Press Arrow Down

**Expected:**
- Arrow Up: Navigate to previous commands
- Arrow Down: Navigate to next commands

---

### 7. Multi-line Paste

#### Test: Paste multiple commands
Copy and paste:
```bash
echo "Command 1"
echo "Command 2"
echo "Command 3"
```

**Expected:**
- All three commands execute sequentially
- Each command added to history

---

### 8. Keyboard Shortcuts

| Shortcut | Action | Expected Result |
|----------|--------|-----------------|
| Ctrl+L | Clear terminal | Screen clears |
| Ctrl+D | Logout | Return to password prompt |
| Ctrl+C | Interrupt | Send SIGINT to current process |
| Tab | Autocomplete | Tab character sent to shell |
| Arrow Up/Down | History | Navigate command history |
| Arrow Left/Right | Cursor | Move cursor in command line |

---

### 9. Connection Status

#### Test: Connection indicator
1. Observe the coffee mug icon in the header
2. Check the status text

**Expected:**
- Green glow when connected
- Amber pulse when reconnecting
- Status text: "connected" (green), "reconnecting" (yellow), "disconnected" (red)

---

### 10. Play/Stop Button

#### Test: Activity indicator
1. Run a command
2. Observe the play/stop button

**Expected:**
- Stop icon (⏹️) when command is running
- Play icon (▶️) when idle (3+ seconds of inactivity)

---

### 11. Viewer Count (Admin only)

**Expected:**
- Badge showing number of connected viewers
- Updates when clients connect/disconnect

---

### 12. ANSI Color Support

#### Test: Colored output
```bash
system-status
```

**Expected:**
- Colors render correctly (green for READY, red for DOWN, etc.)
- No escape sequences visible in output

---

## Known Issues

1. **Windows Compatibility:** Some bash scripts may not work on Windows PowerShell
   - Solution: Use WSL or Git Bash
   
2. **Port 3002 Dependency:** `ai-status` and `ai-check` require status API server
   - Solution: Ensure status API server is running on port 3002

3. **jq Dependency:** Some scripts provide enhanced output with jq
   - Solution: Install jq for better formatting

---

## Success Criteria

✅ All custom commands execute without errors
✅ ANSI colors render correctly
✅ Command history works (arrow up/down)
✅ Keyboard shortcuts work (Ctrl+L, Ctrl+D, Ctrl+C)
✅ Multi-line paste executes all commands
✅ Connection status updates correctly
✅ Play/stop button reflects activity
✅ Standard shell commands work
✅ Scripts stream output in real-time
✅ Authentication works (password prompt)
✅ Logout returns to password prompt

---

## Troubleshooting

### Terminal server won't start
- Check if port 3003 is already in use: `netstat -ano | findstr :3003`
- Kill the process: `taskkill //F //PID <PID>`

### Commands not executing
- Verify terminal server is running
- Check browser console for WebSocket errors
- Verify password is correct

### Scripts not found
- Verify scripts exist in `terminal/scripts/`
- Check scripts are executable: `ls -la terminal/scripts/**/*.sh`
- Verify server.js CUSTOM_COMMANDS mapping

### ANSI colors not showing
- Verify xterm.js is properly initialized
- Check terminal theme configuration
- Ensure scripts output ANSI escape codes

---

## Automated Testing (Future)

Consider adding automated tests for:
- WebSocket connection/reconnection
- Command execution and output streaming
- Script execution and error handling
- Authentication flow
- Command history management
- Multi-line paste detection

