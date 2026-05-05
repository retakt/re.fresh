# 🖥️ Open Terminal Setup Guide

Complete guide for setting up Open Terminal on both local PC and VPS server.

---

## 📋 What is Open Terminal?

Open Terminal is a Docker container that provides a REST API for executing shell commands remotely. Your admin panel uses it to run system status checks and monitoring scripts.

**Current Setup:**
- **Local PC**: `http://localhost:8001` (port 8001:8000)
- **API Key**: `terminal123`
- **Environment Variable**: `OPEN_TERMINAL_EXECUTE_TIMEOUT=30`

---

## 🚀 Local PC Setup (Windows)

### 1. Docker Command

```bash
docker run -d \
  --name open-terminal \
  -p 8001:8000 \
  -e OPEN_TERMINAL_API_KEY=terminal123 \
  -e OPEN_TERMINAL_EXECUTE_TIMEOUT=30 \
  ghcr.io/pythonbrad/open_terminal:latest
```

**Explanation:**
- `-d` - Run in background (detached)
- `--name open-terminal` - Container name
- `-p 8001:8000` - Map port 8001 (host) to 8000 (container)
- `-e OPEN_TERMINAL_API_KEY=terminal123` - Set API key
- `-e OPEN_TERMINAL_EXECUTE_TIMEOUT=30` - 30 second timeout for commands
- `ghcr.io/pythonbrad/open_terminal:latest` - Docker image

### 2. Verify It's Running

```bash
# Check container status
docker ps | grep open-terminal

# Test the API
curl http://localhost:8001/api/config

# Test command execution
curl -X POST http://localhost:8001/execute?wait=5 \
  -H "Authorization: Bearer terminal123" \
  -H "Content-Type: application/json" \
  -d '{"command": "echo Hello World"}'
```

### 3. Manage Container

```bash
# Stop container
docker stop open-terminal

# Start container
docker start open-terminal

# Restart container
docker restart open-terminal

# View logs
docker logs open-terminal

# Remove container
docker rm -f open-terminal
```

---

## 🌐 VPS Server Setup

### Option 1: Same Setup as Local

```bash
# SSH into VPS
ssh root@172.86.90.232

# Run Open Terminal container
docker run -d \
  --name open-terminal \
  --restart unless-stopped \
  -p 8001:8000 \
  -e OPEN_TERMINAL_API_KEY=terminal123 \
  -e OPEN_TERMINAL_EXECUTE_TIMEOUT=30 \
  ghcr.io/pythonbrad/open_terminal:latest

# Verify
curl http://localhost:8001/api/config
```

### Option 2: With Volume Mounts (Recommended)

This allows Open Terminal to access your scripts and project files:

```bash
# SSH into VPS
ssh root@172.86.90.232

# Run with volume mounts
docker run -d \
  --name open-terminal \
  --restart unless-stopped \
  -p 8001:8000 \
  -v /var/www/retakt:/workspace/retakt:ro \
  -v /var/www/yt-downloader:/workspace/yt:ro \
  -e OPEN_TERMINAL_API_KEY=terminal123 \
  -e OPEN_TERMINAL_EXECUTE_TIMEOUT=30 \
  ghcr.io/pythonbrad/open_terminal:latest
```

**Benefits:**
- Can execute scripts from your deployed projects
- Read-only mounts (`:ro`) for security
- Access to monitoring scripts

---

## 🔧 Configuration

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `OPEN_TERMINAL_API_KEY` | `terminal123` | Authentication key |
| `OPEN_TERMINAL_EXECUTE_TIMEOUT` | `30` | Command timeout (seconds) |

### Port Mapping

| Host Port | Container Port | Purpose |
|-----------|----------------|---------|
| `8001` | `8000` | Open Terminal API |

### Security Notes

1. **API Key**: Change `terminal123` to a strong random key in production
2. **Firewall**: Only allow localhost access (don't expose port 8001 publicly)
3. **Volume Mounts**: Use read-only (`:ro`) when possible
4. **Network**: Consider using Docker networks for isolation

---

## 📝 Update .env Files

### Local Development (.env.local)

```env
# Open Terminal (Local testing)
VITE_OPEN_TERMINAL_URL=http://localhost:8001
VITE_OPEN_TERMINAL_API_KEY=terminal123
```

### Production (.env.production)

```env
# Open Terminal (VPS)
VITE_OPEN_TERMINAL_URL=http://localhost:8001
VITE_OPEN_TERMINAL_API_KEY=terminal123
```

**Note**: Keep it as `localhost:8001` even on VPS since the web app runs on the same server.

---

## 🧪 Testing

### Test Local Setup

```bash
# 1. Check container is running
docker ps | grep open-terminal

# 2. Test API config
curl http://localhost:8001/api/config

# 3. Test command execution
curl -X POST http://localhost:8001/execute?wait=5 \
  -H "Authorization: Bearer terminal123" \
  -H "Content-Type: application/json" \
  -d '{"command": "date"}'

# 4. Test from your app
npm run dev
# Navigate to /admin and try the terminal
```

### Test VPS Setup

```bash
# SSH into VPS
ssh root@172.86.90.232

# Test locally on VPS
curl http://localhost:8001/api/config

# Test command execution
curl -X POST http://localhost:8001/execute?wait=5 \
  -H "Authorization: Bearer terminal123" \
  -H "Content-Type: application/json" \
  -d '{"command": "hostname && date"}'
```

---

## 🔄 Integration with Deployment

### Add to deploy-full.sh

You can add Open Terminal setup to your deployment script:

```bash
# Add this section after "Step 9: Deploy Backend"

# ============================================================================
# Step 10: Setup Open Terminal (if not running)
# ============================================================================
echo "▶ Setting up Open Terminal on VPS..."

ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    # Check if Open Terminal is running
    if docker ps | grep -q open-terminal; then
        echo "✓ Open Terminal already running"
    else
        echo "Starting Open Terminal..."
        docker run -d \
          --name open-terminal \
          --restart unless-stopped \
          -p 8001:8000 \
          -v /var/www/retakt:/workspace/retakt:ro \
          -v /var/www/yt-downloader:/workspace/yt:ro \
          -e OPEN_TERMINAL_API_KEY=terminal123 \
          -e OPEN_TERMINAL_EXECUTE_TIMEOUT=30 \
          ghcr.io/pythonbrad/open_terminal:latest
        
        sleep 3
        
        if docker ps | grep -q open-terminal; then
            echo "✓ Open Terminal started successfully"
        else
            echo "✗ Failed to start Open Terminal"
        fi
    fi
EOF

echo "✓ Open Terminal setup complete"
echo ""
```

---

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check if port is already in use
lsof -i :8001

# Check Docker logs
docker logs open-terminal

# Remove and recreate
docker rm -f open-terminal
# Then run the docker run command again
```

### API Not Responding

```bash
# Check container is running
docker ps | grep open-terminal

# Check container logs
docker logs open-terminal

# Test with curl
curl -v http://localhost:8001/api/config
```

### Permission Denied Errors

```bash
# If using volume mounts, check permissions
ls -la /var/www/retakt
ls -la /var/www/yt-downloader

# Make scripts executable
chmod +x /var/www/retakt/scripts/*.sh
```

### Timeout Issues

```bash
# Increase timeout
docker rm -f open-terminal
docker run -d \
  --name open-terminal \
  -p 8001:8000 \
  -e OPEN_TERMINAL_API_KEY=terminal123 \
  -e OPEN_TERMINAL_EXECUTE_TIMEOUT=60 \
  ghcr.io/pythonbrad/open_terminal:latest
```

---

## 📊 Current Integration

### Where It's Used

1. **Admin Terminal** (`/admin` page)
   - Executes `system-status` command
   - Runs monitoring scripts
   - Shows real-time service status

2. **Terminal Library** (`src/lib/terminal.ts`)
   - `executeTerminalCommand()` - Execute any command
   - `executeSystemStatusCheck()` - Check all services
   - `startBackgroundMonitor()` - Start 24/7 monitoring
   - `stopBackgroundMonitor()` - Stop monitoring

3. **Monitoring Scripts** (`scripts/`)
   - `ai-monitor.sh` - Main monitoring loop
   - `start-monitor.sh` - Start background monitor
   - `stop-monitor.sh` - Stop background monitor

---

## 🔐 Security Best Practices

1. **Change API Key**: Use a strong random key
   ```bash
   # Generate random key
   openssl rand -hex 32
   ```

2. **Firewall Rules**: Block external access to port 8001
   ```bash
   # Only allow localhost
   ufw deny 8001
   ```

3. **Read-Only Mounts**: Use `:ro` flag for volume mounts

4. **Network Isolation**: Use Docker networks
   ```bash
   docker network create app-network
   docker run --network app-network ...
   ```

5. **Regular Updates**: Keep container image updated
   ```bash
   docker pull ghcr.io/pythonbrad/open_terminal:latest
   docker rm -f open-terminal
   # Run docker run command again
   ```

---

## 📚 Quick Reference

```bash
# Start Open Terminal (Local/VPS)
docker run -d --name open-terminal -p 8001:8000 \
  -e OPEN_TERMINAL_API_KEY=terminal123 \
  -e OPEN_TERMINAL_EXECUTE_TIMEOUT=30 \
  ghcr.io/pythonbrad/open_terminal:latest

# Check status
docker ps | grep open-terminal

# Test API
curl http://localhost:8001/api/config

# View logs
docker logs open-terminal

# Restart
docker restart open-terminal

# Stop
docker stop open-terminal

# Remove
docker rm -f open-terminal
```

---

**Need help? Check the logs or test the API endpoints!**
