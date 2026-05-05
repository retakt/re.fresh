# 🚀 Deployment Guide

Complete guide for deploying your project with MCP server integration.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **SSH Access** to your VPS (172.86.90.232)
2. **Environment Variables** set:
   ```bash
   export CLOUDFLARE_ZONE_ID="your-zone-id"
   export CLOUDFLARE_API_TOKEN="your-api-token"
   ```
3. **Node.js** installed locally
4. **Dependencies** installed: `npm install`

---

## 🎯 Quick Start

### Option 1: Full Deployment (Recommended)

Deploy everything including MCP server startup:

```bash
./deploy-full.sh
```

This will:
- ✅ Start MCP server (if not running)
- ✅ Build main website
- ✅ Build YT subdomain (if exists)
- ✅ Create deployment archives
- ✅ Deploy to VPS
- ✅ Purge Cloudflare cache
- ✅ Clean up local files

### Option 2: Deploy with Existing Build

Skip the build step and use existing dist:

```bash
./deploy-full.sh beta-v1.7 true
```

### Option 3: Original Deployment (No MCP)

Use the original deployment script:

```bash
./deploy.sh
```

---

## 🔧 MCP Server Management

### Start MCP Server

```bash
./scripts/start-mcp.sh
```

This will:
- Install dependencies (if needed)
- Start MCP API server on port 3002
- Create logs/mcp-server.log
- Save PID to logs/mcp-server.pid

### Stop MCP Server

```bash
./scripts/stop-mcp.sh
```

### Check MCP Server Status

```bash
curl http://localhost:3002/status
```

### View MCP Server Logs

```bash
tail -f logs/mcp-server.log
```

---

## 📁 Project Structure

```
.
├── deploy-full.sh          # Full deployment with MCP
├── deploy.sh               # Original deployment script
├── start-mcp.sh            # Start MCP server
├── stop-mcp.sh             # Stop MCP server
├── mcp-server/
│   ├── ai-status-api.js    # MCP HTTP API (port 3002)
│   ├── ai-mcp-server.js    # MCP stdio server
│   └── package.json
├── logs/
│   ├── mcp-server.log      # MCP server logs
│   └── mcp-server.pid      # MCP server process ID
└── dist/                   # Built website
```

---

## 🌐 Deployment Targets

### Main Website
- **URL**: https://retakt.cc
- **Path**: /var/www/retakt
- **Source**: dist/

### YT Subdomain (if exists)
- **URL**: https://yt.retakt.cc
- **Path**: /var/www/yt-downloader/dist
- **Source**: yt/dist/

### Backend (if exists)
- **URL**: https://yt.retakt.cc/api
- **Path**: /var/www/yt-downloader/backend
- **Source**: yt/backend/

---

## 🔍 Verification Steps

After deployment, verify everything is working:

### 1. Check Main Website
```bash
curl -I https://retakt.cc
```

### 2. Check MCP Server (Local)
```bash
curl http://localhost:3002/status
```

### 3. Check Backend API (if exists)
```bash
curl https://yt.retakt.cc/api/health
```

### 4. Check Admin Panel
```bash
curl -I https://retakt.cc/admin
```

---

## 🐛 Troubleshooting

### MCP Server Won't Start

1. Check if port 3002 is already in use:
   ```bash
   lsof -i :3002
   ```

2. Check logs:
   ```bash
   tail -f logs/mcp-server.log
   ```

3. Kill existing process:
   ```bash
   ./stop-mcp.sh
   ```

### Deployment Fails

1. Check SSH connection:
   ```bash
   ssh root@172.86.90.232 "echo 'Connection OK'"
   ```

2. Check VPS disk space:
   ```bash
   ssh root@172.86.90.232 "df -h"
   ```

3. Check VPS services:
   ```bash
   ssh root@172.86.90.232 "systemctl status nginx"
   ```

### Build Fails

1. Clean node_modules:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check TypeScript errors:
   ```bash
   npm run build
   ```

### Cloudflare Cache Not Purging

1. Verify environment variables:
   ```bash
   echo $CLOUDFLARE_ZONE_ID
   echo $CLOUDFLARE_API_TOKEN
   ```

2. Test API manually:
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

---

## 📊 Monitoring

### Check MCP Server Health
```bash
# Quick status
curl http://localhost:3002/status

# Specific tool
curl http://localhost:3002/status/Weather

# All tools with details
curl http://localhost:3002/status | jq
```

### Monitor Logs in Real-Time
```bash
# MCP Server
tail -f logs/mcp-server.log

# System logs (on VPS)
ssh root@172.86.90.232 "tail -f /var/log/nginx/access.log"
```

---

## 🔄 Workflow Examples

### Standard Deployment
```bash
# 1. Start MCP server
./start-mcp.sh

# 2. Make your changes
# ... edit files ...

# 3. Deploy everything
./deploy-full.sh

# 4. Verify
curl http://localhost:3002/status
curl -I https://retakt.cc
```

### Quick Update (No Build)
```bash
# Use existing build
./deploy-full.sh beta-v1.7 true
```

### Development Workflow
```bash
# Start MCP server
./start-mcp.sh

# Start dev server
npm run dev

# In another terminal, test MCP
curl http://localhost:3002/status
```

---

## 🛡️ Security Notes

1. **SSH Keys**: Use SSH keys instead of passwords
2. **Environment Variables**: Never commit credentials to git
3. **Firewall**: Ensure only necessary ports are open on VPS
4. **MCP Server**: Only accessible locally (localhost:3002)
5. **Cloudflare**: Use API tokens with minimal permissions

---

## 📝 Version History

- **v1.7**: Added MCP server integration
- **v1.6**: Added backend deployment
- **v1.5**: Added YT subdomain support
- **v1.4**: Added Cloudflare cache purging
- **v1.3**: Initial deployment script

---

## 💡 Tips

1. **Always test locally first**: Run `npm run dev` before deploying
2. **Check MCP server**: Ensure it's running before deployment
3. **Monitor logs**: Keep an eye on logs during deployment
4. **Backup before deploy**: VPS files are overwritten
5. **Use version tags**: Tag deployments for easy rollback

---

## 🆘 Support

If you encounter issues:

1. Check logs: `tail -f logs/mcp-server.log`
2. Verify services: `curl http://localhost:3002/status`
3. Test SSH: `ssh root@172.86.90.232`
4. Check VPS: `ssh root@172.86.90.232 "systemctl status nginx"`

---

## 📞 Quick Commands Reference

```bash
# MCP Server
./start-mcp.sh                    # Start MCP server
./stop-mcp.sh                     # Stop MCP server
curl localhost:3002/status        # Check status

# Deployment
./deploy-full.sh                  # Full deployment
./deploy-full.sh v1.7 true        # Deploy without build
./deploy.sh                       # Original deployment

# Monitoring
tail -f logs/mcp-server.log       # View MCP logs
lsof -i :3002                     # Check port 3002
ps aux | grep node                # Check Node processes

# VPS
ssh root@172.86.90.232            # Connect to VPS
ssh root@172.86.90.232 "df -h"    # Check disk space
ssh root@172.86.90.232 "free -h"  # Check memory
```

---

**Ready to deploy? Run `./deploy-full.sh` and you're good to go! 🚀**
