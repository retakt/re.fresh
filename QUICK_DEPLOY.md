# ⚡ Quick Deploy Reference

## 🚀 One-Command Deploy

```bash
./deploy-full.sh
```

That's it! This will:
- ✅ Start MCP server (if not running)
- ✅ Build everything
- ✅ Deploy to VPS
- ✅ Purge Cloudflare cache

---

## 📋 Common Commands

| Task | Command |
|------|---------|
| **Full Deploy** | `./deploy-full.sh` |
| **Deploy (skip build)** | `./deploy-full.sh v1.7 true` |
| **Start MCP** | `./scripts/start-mcp.sh` |
| **Stop MCP** | `./scripts/stop-mcp.sh` |
| **Check MCP** | `curl localhost:3002/status` |
| **View Logs** | `tail -f logs/mcp-server.log` |

---

## 🔍 Quick Checks

```bash
# Is MCP running?
lsof -i :3002

# Is site live?
curl -I https://retakt.cc

# Check MCP health
curl localhost:3002/status | head -n 10
```

---

## 🐛 Quick Fixes

### MCP won't start?
```bash
./scripts/stop-mcp.sh
./scripts/start-mcp.sh
```

### Deploy failed?
```bash
# Check SSH
ssh root@172.86.90.232 "echo OK"

# Check disk space
ssh root@172.86.90.232 "df -h"
```

### Build failed?
```bash
rm -rf node_modules
npm install
npm run build
```

---

## 📁 What Gets Deployed?

- **Main Site**: `dist/` → `https://retakt.cc`
- **YT Site**: `yt/dist/` → `https://yt.retakt.cc`
- **Backend**: `yt/backend/` → `https://yt.retakt.cc/api`

---

## 🎯 Workflow

```bash
# 1. Start MCP (first time only)
./scripts/start-mcp.sh

# 2. Make changes
# ... edit your code ...

# 3. Deploy
./deploy-full.sh

# 4. Done! ✨
```

---

## 💡 Pro Tips

- **Skip build**: Add `true` as second argument
- **Custom version**: Add version as first argument
- **Check before deploy**: Run `npm run build` first
- **Monitor logs**: Keep `tail -f logs/mcp-server.log` open

---

## 🆘 Emergency

```bash
# Stop everything
./scripts/stop-mcp.sh
pkill -f "node"

# Restart MCP
./scripts/start-mcp.sh

# Redeploy
./deploy-full.sh
```

---

**Need more details? Check `DEPLOY_NOW.md`**
