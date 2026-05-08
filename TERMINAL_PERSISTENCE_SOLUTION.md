# Terminal Authentication & History Persistence Solution

## Problem
The terminal had two issues:
1. **Authentication**: Asked for password every time you switched between menu items
2. **History Loss**: Terminal history was lost when navigating away and back

### Root Causes:
1. React Router was unmounting/remounting the terminal component on navigation
2. WebSocket connection was tied to component lifecycle  
3. Authentication state was lost on component unmount
4. xterm.js Terminal instance was disposed, losing all display history

## Solution
Implemented a **Context-based WebSocket connection with history persistence** that survives navigation:

### Key Changes

1. **Created `TerminalProvider` Context** (`src/contexts/terminal-context.tsx`):
   - Manages WebSocket connection at app level (above routing)
   - Connection survives component unmounting/remounting
   - Handles session storage and restoration
   - **Stores terminal output history in memory**
   - Provides terminal registration system with history restoration

2. **Updated App Structure** (`src/App.tsx`):
   - Added `TerminalProvider` at top level, wrapping all routes
   - Connection and history now persist across all navigation

3. **Modified SharedTerminal Component** (`src/components/terminal/shared-terminal.tsx`):
   - Now uses `useTerminalContext()` instead of `useTerminalWs()` hook
   - Registers/unregisters terminal instance with context
   - **Automatically restores history when component mounts**
   - No longer manages WebSocket connection directly

### How It Works

```
App Level:
├── TerminalProvider (manages WebSocket + history buffer)
│   ├── Router (handles navigation)
│   │   ├── /terminal → SharedTerminal (registers + gets history)
│   │   ├── /admin → Other pages
│   │   └── /blog → Other pages
│   └── WebSocket + History stays alive during navigation
```

### Benefits

✅ **True Connection Persistence**: WebSocket connection stays alive across navigation  
✅ **No Re-authentication**: Password entered once, works until session expires  
✅ **Complete History Preservation**: All terminal output preserved across navigation  
✅ **Instant Restoration**: History appears immediately when returning to terminal  
✅ **Session Management**: 30-minute sessions with activity-based extension  
✅ **Auto-logout**: 1 hour inactivity timeout for security  
✅ **Seamless UX**: No interruption when switching between menu items  

### Session & History Behavior

- **First Visit**: Enter password as usual
- **Navigation**: Connection stays alive, history preserved in memory
- **Return to Terminal**: Instantly connected with full history restored
- **Commands**: All new output added to persistent history buffer
- **Clear/Reset**: History buffer cleared when you run clear/reset commands
- **Session Expiry**: 30 minutes (extended on activity)
- **Inactivity Logout**: 1 hour of no terminal activity (clears history)
- **Manual Logout**: Ctrl+D or "logout" command (clears history)

### Technical Details

- WebSocket connection managed by React Context
- **Terminal output buffered in `terminalHistoryRef.current`**
- **History restored via `registerTerminal()` when component mounts**
- Session storage for password persistence
- Terminal registration system for multiple instances
- Activity tracking for session extension
- Automatic reconnection with stored credentials
- Clean separation of connection logic from UI components
- **History cleared on logout, clear, or reset commands**

This solution completely eliminates both the password prompt issue and history loss while maintaining security through proper session management.