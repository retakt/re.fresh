# Pre-Deployment Fix Plan

## Issues Identified

### 1. Terminal Sizing & Scrolling ❌
- **Problem**: Terminal not fitting properly, text wrapping incorrectly
- **Root Cause**: FitAddon not recalculating on mount, container size issues
- **Impact**: Unusable terminal, can't see full output

### 2. Scrollbar Missing/Broken ❌
- **Problem**: Can't scroll through terminal output
- **Root Cause**: xterm.js scrollbar not styled or visible
- **Impact**: Can't view command history

### 3. PowerShell Compatibility ⚠️
- **Problem**: May have issues on Windows PowerShell
- **Root Cause**: Bash-specific scripts, shell detection
- **Impact**: Commands may fail on VPS if using PowerShell

### 4. Text Formatting Issues ❌
- **Problem**: Lines breaking incorrectly, weird spacing
- **Root Cause**: Terminal cols/rows not matching container
- **Impact**: Poor readability, unprofessional appearance

### 5. Auto-scroll Not Working ❌
- **Problem**: Terminal doesn't auto-scroll to bottom
- **Root Cause**: Auto-scroll logic not implemented properly
- **Impact**: User has to manually scroll

## Fix Strategy

### Phase 1: Terminal Sizing (CRITICAL)
**Priority**: P0 - Must fix before deployment

**Changes:**
1. Add proper container sizing with explicit dimensions
2. Fix FitAddon to recalculate on mount and resize
3. Add debounced resize handler
4. Ensure terminal fills available space
5. Add padding/margins for proper fit

**Implementation:**
```typescript
// 1. Add ResizeObserver for container changes
const resizeObserver = new ResizeObserver(() => {
  fitAddon.fit();
});
resizeObserver.observe(terminalContainerRef.current);

// 2. Add debounced resize
const debouncedFit = debounce(() => fitAddon.fit(), 100);

// 3. Fit after mount with delay
setTimeout(() => fitAddon.fit(), 100);
```

### Phase 2: Scrollbar Styling (CRITICAL)
**Priority**: P0 - Must fix before deployment

**Changes:**
1. Enable xterm.js scrollbar
2. Style scrollbar to match theme (yellow/amber)
3. Make scrollbar minimal and unobtrusive
4. Add custom CSS for scrollbar

**Implementation:**
```css
/* Custom scrollbar for xterm.js */
.xterm .xterm-viewport::-webkit-scrollbar {
  width: 8px;
}

.xterm .xterm-viewport::-webkit-scrollbar-track {
  background: rgba(26, 15, 10, 0.5);
}

.xterm .xterm-viewport::-webkit-scrollbar-thumb {
  background: rgba(251, 191, 36, 0.5); /* Amber-400 */
  border-radius: 4px;
}

.xterm .xterm-viewport::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 191, 36, 0.8);
}
```

### Phase 3: Auto-scroll Fix (HIGH)
**Priority**: P1 - Important for UX

**Changes:**
1. Implement proper auto-scroll on new output
2. Detect user scroll and disable auto-scroll
3. Re-enable auto-scroll when user scrolls to bottom
4. Add smooth scrolling

**Implementation:**
```typescript
// Auto-scroll to bottom on new data
terminal.onData(() => {
  if (!userScrolledUp.current) {
    terminal.scrollToBottom();
  }
});

// Detect user scroll
terminal.onScroll(() => {
  const isAtBottom = terminal.buffer.active.viewportY === 
    terminal.buffer.active.baseY;
  userScrolledUp.current = !isAtBottom;
});
```

### Phase 4: PowerShell Compatibility (HIGH)
**Priority**: P1 - Critical for VPS deployment

**Changes:**
1. Detect shell type on server
2. Use bash on Linux, PowerShell on Windows
3. Test all scripts on both shells
4. Add shell-specific command handling
5. Document VPS requirements

**Server Detection:**
```javascript
// In terminal/server.js
const shell = process.platform === "win32" ? "powershell.exe" : "bash";
const shellArgs = process.platform === "win32" ? ["-NoProfile", "-Command"] : [];
```

**VPS Requirements:**
- Linux VPS: bash (already installed)
- Windows VPS: PowerShell (already installed)
- Recommended: Linux VPS for better compatibility

### Phase 5: Text Formatting (MEDIUM)
**Priority**: P2 - Nice to have

**Changes:**
1. Adjust terminal font size for better fit
2. Set proper line height
3. Ensure ANSI codes render correctly
4. Test with long output

**Implementation:**
```typescript
const draculaConfig = {
  fontSize: 13, // Slightly smaller for better fit
  lineHeight: 1.2, // Tighter line spacing
  letterSpacing: 0, // No extra spacing
  fontWeight: 400,
  fontWeightBold: 700,
};
```

## Testing Checklist

### Before Deployment
- [ ] Terminal fits container properly
- [ ] Scrollbar visible and functional
- [ ] Can scroll through long output
- [ ] Auto-scroll works on new output
- [ ] Text doesn't wrap incorrectly
- [ ] All commands execute properly
- [ ] ANSI colors render correctly
- [ ] Keyboard shortcuts work
- [ ] Multi-line paste works
- [ ] Connection status updates

### On VPS (Linux)
- [ ] Terminal server starts
- [ ] WebSocket connects
- [ ] All bash scripts execute
- [ ] System commands work
- [ ] Monitoring scripts work
- [ ] AI status checks work
- [ ] No permission errors
- [ ] No path issues

### On VPS (Windows - if applicable)
- [ ] PowerShell spawns correctly
- [ ] Basic commands work
- [ ] Custom commands may need adjustment
- [ ] Document limitations

## Deployment Plan

### Step 1: Apply Fixes Locally
1. Fix terminal sizing
2. Add scrollbar styling
3. Fix auto-scroll
4. Test thoroughly

### Step 2: Test on Local Windows (if available)
1. Test PowerShell compatibility
2. Verify all commands work
3. Document any issues

### Step 3: Prepare for VPS
1. Update environment variables
2. Document VPS requirements
3. Create deployment script
4. Test with production-like setup

### Step 4: Deploy to VPS
1. Upload code to VPS
2. Install dependencies
3. Configure environment
4. Start terminal server
5. Test all functionality
6. Monitor for issues

### Step 5: Post-Deployment
1. Monitor server logs
2. Check for errors
3. Verify all commands work
4. Get user feedback
5. Fix any issues

## VPS Deployment Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Git installed (for deployment)
- [ ] Port 3003 available
- [ ] Firewall configured
- [ ] SSL certificate (if using HTTPS)

### Environment Setup
```bash
# .env.local on VPS
TERMINAL_PORT=3003
TERMINAL_PASSWORD=<secure-password>
TERMINAL_CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

### Deployment Script
```bash
#!/bin/bash
# deploy-terminal.sh

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build frontend (if needed)
npm run build

# Restart terminal server
pm2 restart terminal-server || pm2 start terminal/server.js --name terminal-server

# Check status
pm2 status
```

### Process Management
Use PM2 for production:
```bash
# Install PM2
npm install -g pm2

# Start terminal server
pm2 start terminal/server.js --name terminal-server

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### Nginx Configuration (if using reverse proxy)
```nginx
# /etc/nginx/sites-available/terminal
location /terminal-ws {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

## Known Limitations

### PowerShell on Windows
- Some bash scripts won't work
- Need PowerShell equivalents
- May need to adjust commands

### VPS Considerations
- Requires persistent process (use PM2)
- Needs proper firewall rules
- May need reverse proxy for HTTPS
- Resource usage: ~50-100MB RAM per session

### Security
- Password authentication only
- No rate limiting (add if needed)
- No IP whitelisting (add if needed)
- Script path validation in place

## Rollback Plan

If deployment fails:
1. Stop terminal server: `pm2 stop terminal-server`
2. Revert code: `git reset --hard <previous-commit>`
3. Restart with old code: `pm2 restart terminal-server`
4. Investigate issues
5. Fix and redeploy

## Success Criteria

✅ Terminal displays correctly
✅ Scrolling works smoothly
✅ All commands execute
✅ No text formatting issues
✅ Auto-scroll functions properly
✅ Keyboard shortcuts work
✅ Multi-user support works
✅ Server stable for 24+ hours
✅ No memory leaks
✅ Performance acceptable

## Timeline

- **Phase 1-2 (Critical)**: 1-2 hours
- **Phase 3-4 (High)**: 1-2 hours
- **Phase 5 (Medium)**: 30 minutes
- **Testing**: 1-2 hours
- **VPS Deployment**: 1-2 hours
- **Total**: 5-8 hours

## Next Steps

1. Apply Phase 1 & 2 fixes (terminal sizing + scrollbar)
2. Test locally
3. Apply Phase 3 & 4 fixes (auto-scroll + PowerShell)
4. Test again
5. Prepare VPS deployment
6. Deploy and monitor

