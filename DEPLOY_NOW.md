# Quick Deployment Guide

## Critical Fix Applied ✅

**Problem:** API was trying to connect to `localhost:3000` instead of production backend
**Solution:** Changed API to use relative URL `/api` in production builds

## Deploy Now

Run this command to deploy the fixed build:

```bash
bash deploy.sh
```

Or if you prefer PowerShell:
```powershell
bash deploy.sh
```

## What This Will Do

1. ✅ Build main website (already built)
2. ✅ Build YT subdomain (already built with fix)
3. ✅ Create deployment archives
4. ✅ Deploy to VPS at `/var/www/yt-downloader/dist/`
5. ✅ Deploy backend (restart Docker containers)
6. ✅ Purge Cloudflare cache

## After Deployment

1. Wait 2 minutes for CDN propagation
2. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Test download functionality at: https://yt.retakt.cc

## What Was Fixed

### API Connection Issue
- **Before:** `http://localhost:3000/api/download` ❌
- **After:** `https://yt.retakt.cc/api/download` ✅

### Deployment Path Issue  
- **Before:** Deployed to `/var/www/yt-downloader/frontend/` ❌
- **After:** Deploys to `/var/www/yt-downloader/dist/` ✅

### Code Changes
```typescript
// yt/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === "production" ? "/api" : "http://localhost:3000/api");
```

This automatically uses:
- **Production:** `/api` → resolves to `https://yt.retakt.cc/api`
- **Development:** `http://localhost:3000/api`

## Verify Backend is Running

After deployment, check:
```bash
ssh root@172.86.90.232
cd /var/www/yt-downloader/backend
docker-compose ps
```

Should show containers running. If not:
```bash
docker-compose up -d
```

## Commits Pushed

1. ✅ `2238420` - beta_v1.6.1 (deployment path fix + dark mode lock)
2. ✅ `b769485` - API URL fix (relative path in production)

Ready to deploy! 🚀
