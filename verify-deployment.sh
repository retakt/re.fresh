#!/bin/bash
# ============================================================================
# Deployment Verification Script
# Checks if YT frontend files are correctly deployed on VPS
# ============================================================================

set -e

VPS_IP="172.86.90.232"
VPS_USER="root"

echo "============================================================================"
echo "  Deployment Verification"
echo "============================================================================"
echo ""

# Check local build
echo "▶ Checking local build..."
if [ -d "yt/dist" ]; then
    echo "  ✓ yt/dist directory exists"
    echo "  Files in yt/dist:"
    ls -lh yt/dist/
    echo ""
    if [ -d "yt/dist/assets" ]; then
        echo "  Files in yt/dist/assets:"
        ls -lh yt/dist/assets/
    fi
else
    echo "  ✗ yt/dist directory not found!"
fi
echo ""

# Check if archive exists
echo "▶ Checking deployment archive..."
if [ -f "yt-dist.tar.gz" ]; then
    echo "  ✓ yt-dist.tar.gz exists"
    echo "  Size: $(du -h yt-dist.tar.gz | cut -f1)"
    echo "  Contents:"
    tar -tzf yt-dist.tar.gz | head -20
else
    echo "  ✗ yt-dist.tar.gz not found!"
fi
echo ""

# Check VPS deployment
echo "▶ Checking VPS deployment..."
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'
    echo "  Checking /var/www/yt-downloader/frontend..."
    if [ -d "/var/www/yt-downloader/frontend" ]; then
        echo "  ✓ Directory exists"
        echo ""
        echo "  Files in /var/www/yt-downloader/frontend:"
        ls -lh /var/www/yt-downloader/frontend/
        echo ""
        if [ -d "/var/www/yt-downloader/frontend/assets" ]; then
            echo "  Files in /var/www/yt-downloader/frontend/assets:"
            ls -lh /var/www/yt-downloader/frontend/assets/
            echo ""
        fi
        echo "  File permissions:"
        ls -la /var/www/yt-downloader/frontend/ | head -10
        echo ""
        if [ -f "/var/www/yt-downloader/frontend/index.html" ]; then
            echo "  ✓ index.html exists"
            echo "  Last modified: $(stat -c %y /var/www/yt-downloader/frontend/index.html)"
        else
            echo "  ✗ index.html not found!"
        fi
    else
        echo "  ✗ Directory not found!"
    fi
EOF

echo ""
echo "============================================================================"
echo "  Verification Complete"
echo "============================================================================"
echo ""
echo "If files are old on VPS, try:"
echo "  1. Run: ./deploy.sh (without SKIP_BUILD flag)"
echo "  2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "  3. Check Cloudflare cache purge status"
echo "  4. Wait 1-2 minutes for CDN propagation"
echo ""
