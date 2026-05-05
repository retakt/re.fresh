# Terminal Monitoring Scripts

This folder contains bash scripts for 24/7 background monitoring of AI services.

## 📁 Structure

```
scripts/
├── ai-monitor.sh       # Main monitoring script (runs continuously)
├── start-monitor.sh    # Start the background monitor
├── stop-monitor.sh     # Stop the background monitor
├── show-monitor.sh     # Show monitor status/logs
└── README.md          # This file
```

## 🚀 Usage

### Start Background Monitoring
```bash
./scripts/start-monitor.sh
```

This will:
- Start the monitor in the background
- Check services every 30 seconds
- Log results to `logs/ai-monitor.log`
- Save PID to `logs/ai-monitor.pid`

### Stop Background Monitoring
```bash
./scripts/stop-monitor.sh
```

### Show Monitor Status
```bash
./scripts/show-monitor.sh
```

Shows:
- Monitor process status
- Recent log entries
- Current service health

## 🔧 How It Works

### ai-monitor.sh
The main monitoring script that:
1. Checks all AI services using `curl`
2. Measures response times
3. Logs results with timestamps
4. Runs continuously in a loop

### start-monitor.sh
- Checks if monitor is already running
- Starts `ai-monitor.sh` in background
- Saves process ID for later management

### stop-monitor.sh
- Reads PID from `logs/ai-monitor.pid`
- Gracefully stops the monitor process
- Cleans up PID file

### show-monitor.sh
- Shows if monitor is running
- Displays recent log entries
- Shows current service status

## 📊 Monitored Services

1. **AI Model** - `https://chat-api.retakt.cc`
2. **Web Search** - `https://search-api.retakt.cc`
3. **Weather API** - `https://wttr.in`
4. **Exchange Rate API** - `https://open.er-api.com`
5. **YouTube API** - `https://yt.retakt.cc`

## 📝 Log Format

```
2026-05-05 12:00:00 | Status Check
● AI Model          READY  150ms
● Web Search        READY  800ms
● Weather API       READY  600ms
● Exchange API      READY  200ms
● YouTube API       READY  900ms
```

## 🔗 Integration

### Terminal Component
The admin terminal (`src/components/admin/simple-terminal.tsx`) can:
- Start monitoring: `start-monitor` command
- Stop monitoring: `stop-monitor` command
- Check status: `system-status` command

### Open Terminal Backend
Scripts execute via Open Terminal API:
- Local: `http://localhost:8001`
- Remote: Configured in `.env.local`

## ⚙️ Configuration

Edit service URLs in `ai-monitor.sh`:

```bash
check_service "AI Model" "https://chat-api.retakt.cc/api/tags" 4
check_service "Web Search" "https://search-api.retakt.cc/search?q=test&format=json" 4
# ... more services
```

## 📍 Log Location

Logs are stored in:
```
logs/
├── ai-monitor.log    # Monitoring logs
└── ai-monitor.pid    # Process ID file
```

## 🛠️ Troubleshooting

**Monitor won't start:**
- Check if already running: `./scripts/show-monitor.sh`
- Check permissions: `chmod +x scripts/*.sh`
- Check logs: `cat logs/ai-monitor.log`

**Services showing DOWN:**
- Verify service URLs are correct
- Check network connectivity
- Increase timeout values in `ai-monitor.sh`

**High response times:**
- Check server load
- Verify network latency
- Consider adjusting thresholds

## 📈 Performance Thresholds

- **READY**: < 2000ms (local services < 500ms)
- **SLOW**: 2000-5000ms
- **DOWN**: > 5000ms or connection failed

## 🔄 Auto-Restart

To run monitor on system boot, add to crontab:
```bash
@reboot /path/to/scripts/start-monitor.sh
```

Or use systemd service (Linux) or Task Scheduler (Windows).
