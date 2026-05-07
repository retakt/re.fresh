# Migration Guide: simple-terminal → shared-terminal

This guide helps you migrate from the old `simple-terminal` to the new `shared-terminal` implementation.

## Overview

The shared-terminal is a complete rewrite that provides:
- **Persistent PTY session** - Terminal state persists across page refreshes
- **Real-time collaboration** - Multiple users can watch the same terminal
- **Native ANSI support** - Full color and formatting via xterm.js
- **Better organization** - Scripts organized in folders, not embedded in code
- **WebSocket streaming** - Real-time output streaming to all connected clients
- **Enhanced UX** - Command history, multi-line paste, keyboard shortcuts

## Key Differences

| Feature | simple-terminal | shared-terminal |
|---------|----------------|-----------------|
| **Backend** | Open Terminal API (external) | node-pty + WebSocket (built-in) |
| **Terminal UI** | Custom React component | xterm.js (industry standard) |
| **Color Support** | Custom ANSI parsing | Native ANSI support |
| **Session** | Per-user, ephemeral | Shared, persistent PTY |
| **Scripts** | Embedded in `src/lib/terminal.ts` | Separate bash files in `terminal/scripts/` |
| **Organization** | Flat structure | Organized folders (system, status, ai) |
| **Authentication** | Supabase JWT | Simple password |
| **Port** | External (8001) | Built-in (3003) |
| **Dependencies** | Open Terminal service | node-pty, ws |

## Migration Steps

### 1. Update Your Workflow

**Old way (simple-terminal):**
```typescript
// Navigate to admin page
// Use simple-terminal component
// Commands execute via Open Terminal API
```

**New way (shared-terminal):**
```typescript
// Navigate to /terminal
// Enter password
// Commands execute in persistent PTY
```

### 2. Update Navigation

The terminal is now accessible at `/terminal` instead of being embedded in an admin page.

**Before:**
```typescript
// Admin page with simple-terminal component
<SimpleTerminal />
```

**After:**
```typescript
// Navigate to /terminal route
// Component: SharedTerminal
```

### 3. Command Compatibility

All commands from simple-terminal work in shared-terminal:

| simple-terminal | shared-terminal | Status |
|----------------|-----------------|--------|
| `system-status` | `system-status` or `status` | ✅ Compatible |
| `ai-status` | `ai-status` or `ai` | ✅ Compatible |
| `ai-check <tool>` | `ai-check <tool>` | ✅ Compatible |
| `start-monitor` | `start-monitor` | ✅ Compatible |
| `stop-monitor` | `stop-monitor` | ✅ Compatible |
| `show-monitor` | `show-monitor` or `monitor` | ✅ Compatible |
| Standard shell | Standard shell | ✅ Compatible |

**New commands in shared-terminal:**
- `help` - Show all available commands
- `check-ollama` - Check Ollama service
- `check-searxng` - Check SearXNG service
- `check-all-ai` - Check all AI services
- `logout` - Return to password prompt

### 4. Update Environment Variables

**Before (.env.local):**
```bash
VITE_OPEN_TERMINAL_URL=http://localhost:8001
VITE_OPEN_TERMINAL_API_KEY=terminal123
```

**After (.env.local):**
```bash
TERMINAL_PORT=3003
TERMINAL_PASSWORD=admin123
TERMINAL_CORS_ORIGIN=*
```

### 5. Start the Terminal Server

**Before:**
```bash
# External Open Terminal service required
# (separate installation and setup)
```

**After:**
```bash
# Built-in terminal server
npm run terminal-server
```

### 6. Authentication

**Before:**
- Supabase JWT authentication
- Complex token management
- Session-based access

**After:**
- Simple password authentication
- Password sent via WebSocket query parameter
- No session management needed

### 7. Script Organization

**Before:**
```typescript
// Scripts embedded in src/lib/terminal.ts
export async function executeSystemStatusCheck(): Promise<string> {
  const script = `
    echo "System Health Check"
    # ... bash script here
  `;
  return await executeTerminalCommand(script);
}
```

**After:**
```bash
# Separate bash file: terminal/scripts/system/health-check.sh
#!/bin/bash
echo "System Health Check"
# ... bash script here
```

### 8. Adding New Commands

**Before:**
```typescript
// Add function to src/lib/terminal.ts
export async function myNewCommand(): Promise<string> {
  const script = `...`;
  return await executeTerminalCommand(script);
}

// Call from component
const result = await myNewCommand();
```

**After:**
```bash
# 1. Create script: terminal/scripts/system/my-command.sh
#!/bin/bash
echo "My new command"

# 2. Register in terminal/server.js
const CUSTOM_COMMANDS = {
  "my-command": "scripts/system/my-command.sh",
};

# 3. Use in terminal
my-command
```

## Feature Comparison

### ✅ Features Available in Both

- System status monitoring
- AI service checks
- Background monitoring
- Command execution
- Colored output
- Command history

### ✨ New Features in shared-terminal

- **Persistent session** - Terminal state survives page refresh
- **Real-time collaboration** - Multiple viewers see the same output
- **Command aliases** - `status`, `ai`, `monitor`
- **Keyboard shortcuts** - Ctrl+L (clear), Ctrl+D (logout)
- **Multi-line paste** - Paste multiple commands at once
- **Activity indicator** - Play/stop button shows command execution
- **Connection status** - Visual indicator with coffee mug icon
- **Viewer count** - See how many users are connected
- **Better ANSI support** - Full xterm.js color rendering
- **Help command** - Built-in command reference

### ⚠️ Features Removed

- **Open Terminal API integration** - No longer needed
- **Per-user sessions** - Now shared persistent PTY
- **Custom ANSI parsing** - Replaced with native xterm.js support

## Troubleshooting

### "Port 3003 already in use"

**Solution:**
```bash
# Find and kill the process
netstat -ano | findstr :3003
taskkill //F //PID <PID>
```

### "Authentication failed"

**Solution:**
- Check `TERMINAL_PASSWORD` in `.env.local`
- Default password is `admin123`
- Restart terminal server after changing password

### "Commands not executing"

**Solution:**
1. Verify terminal server is running: `npm run terminal-server`
2. Check browser console for WebSocket errors
3. Verify scripts are executable: `ls -la terminal/scripts/**/*.sh`
4. Check server logs for errors

### "ANSI colors not showing"

**Solution:**
- xterm.js handles ANSI natively - no action needed
- If colors still don't show, check terminal theme configuration
- Verify scripts output ANSI escape codes

### "Can't connect to WebSocket"

**Solution:**
1. Verify server is running on port 3003
2. Check CORS settings in `.env.local`
3. Verify password is correct
4. Check browser console for errors

## Rollback Plan

If you need to rollback to simple-terminal:

1. **Keep simple-terminal component** - It's still in the codebase
2. **Restore navigation** - Point to simple-terminal instead of /terminal
3. **Restore environment variables** - Use Open Terminal API settings
4. **Stop terminal server** - No longer needed

The deprecation notice in `simple-terminal.tsx` can be removed if needed.

## Testing Checklist

Before fully migrating, test these scenarios:

- [ ] All custom commands execute correctly
- [ ] ANSI colors render properly
- [ ] Command history works (arrow up/down)
- [ ] Keyboard shortcuts work (Ctrl+L, Ctrl+D)
- [ ] Multi-line paste executes all commands
- [ ] Connection status updates correctly
- [ ] Play/stop button reflects activity
- [ ] Standard shell commands work
- [ ] Scripts stream output in real-time
- [ ] Authentication works (password prompt)
- [ ] Logout returns to password prompt
- [ ] Multiple users can connect simultaneously
- [ ] Terminal state persists across page refresh

## Performance Considerations

### simple-terminal
- Each command creates a new process
- Output buffered until completion
- No real-time streaming
- Per-user resource usage

### shared-terminal
- Single persistent PTY process
- Real-time output streaming
- Shared resources across users
- Lower memory footprint

## Security Considerations

### simple-terminal
- JWT authentication via Supabase
- External API dependency
- Token-based access control

### shared-terminal
- Password authentication
- Built-in server (no external dependencies)
- Role-based access (admin can type, others watch)
- Script path validation (prevents directory traversal)

## Support

For issues or questions:

1. Check `terminal/README.md` for detailed documentation
2. Review `terminal/TEST_COMMANDS.md` for testing guide
3. Check server logs for errors
4. Verify all scripts are executable
5. Test with `help` command to see available commands

## Timeline

- **Phase 1** (Complete): Core implementation
- **Phase 2** (Complete): Script migration and organization
- **Phase 3** (Complete): Testing and documentation
- **Phase 4** (Current): Deprecation and cleanup
- **Phase 5** (Future): Remove simple-terminal completely

## Conclusion

The shared-terminal provides a more robust, maintainable, and feature-rich terminal experience. The migration is straightforward, and all existing commands are compatible.

**Recommended approach:**
1. Test shared-terminal alongside simple-terminal
2. Verify all your workflows work
3. Update your team's documentation
4. Switch to shared-terminal as primary
5. Keep simple-terminal as fallback for 1-2 releases
6. Remove simple-terminal completely

**Questions?** Check the documentation in `terminal/README.md` or review the test guide in `terminal/TEST_COMMANDS.md`.

