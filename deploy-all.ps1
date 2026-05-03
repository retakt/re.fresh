#!/usr/bin/env pwsh
# ============================================================================
# Master Deployment Script - Beta v1.6
# Deploys both main website and YT subdomain with full cleanup
# ============================================================================

param(
    [string]$Version = "beta-v1.6",
    [switch]$SkipBuild,
    [switch]$SkipGit
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Master Deployment - $Version" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VPS_IP = "172.86.90.232"
$VPS_USER = "root"
$MAIN_PATH = "/var/www/retakt"
$YT_PATH = "/var/www/yt-downloader"
$CF_ZONE_ID = $env:CLOUDFLARE_ZONE_ID
$CF_API_TOKEN = $env:CLOUDFLARE_API_TOKEN

# ============================================================================
# Step 1: Clean old deployment files
# ============================================================================
Write-Host "▶ Cleaning old deployment files..." -ForegroundColor Yellow

$oldFiles = @(
    "main-dist.tar.gz",
    "yt-dist.tar.gz",
    "ADMIN_GUIDE.md",
    "ADMIN_INTEGRATION_COMPLETE.md",
    "ADMIN_PANEL_EXPLAINED.md",
    "COBALT_SOLUTION.md",
    "COOKIE_SOLUTION.md",
    "DEPLOYMENT_COMPLETE.md",
    "DEPLOYMENT_SUCCESS.md",
    "DEPLOYMENT_SUCCESS_FINAL.md",
    "DEPLOYMENT_UPDATE.md",
    "DEPLOY_README.md",
    "EXPORT_COOKIES_GUIDE.md",
    "FINAL_DEPLOYMENT.md",
    "FINAL_SOLUTION.md",
    "GET_PO_TOKEN.md",
    "MAIN_ADMIN_INTEGRATION.md",
    "MAIN_WEBSITE_INTEGRATION_SETUP.md",
    "OPTIMIZATION_ROADMAP.md",
    "PERFORMANCE_IMPROVEMENTS.md",
    "PRODUCTION_COMPLETE.md",
    "PRODUCTION_README.md",
    "QUICK_START.md",
    "SESSION_MANAGEMENT_DEPLOYED.md",
    "STATUS_MONITORING_EXPLAINED.md",
    "TEST_DOWNLOAD_MANAGER.md",
    "TOKEN_UPDATE_QUICK_GUIDE.md",
    "UI_IMPROVEMENTS_TODO.md",
    "YOUTUBE_BLOCKING_ISSUE.md"
)

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✓ Deleted $file" -ForegroundColor Gray
    }
}

Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Build Main Website
# ============================================================================
if (-not $SkipBuild) {
    Write-Host "▶ Building main website..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Main website build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Main website built" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# Step 3: Build YT Subdomain
# ============================================================================
if (-not $SkipBuild) {
    Write-Host "▶ Building YT subdomain..." -ForegroundColor Yellow
    Set-Location yt
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ YT subdomain build failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    Write-Host "✓ YT subdomain built" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# Step 4: Create deployment archives
# ============================================================================
Write-Host "▶ Creating deployment archives..." -ForegroundColor Yellow

# Main website
tar -czf main-dist.tar.gz -C dist .
Write-Host "  ✓ main-dist.tar.gz created" -ForegroundColor Gray

# YT subdomain
tar -czf yt-dist.tar.gz -C yt/dist .
Write-Host "  ✓ yt-dist.tar.gz created" -ForegroundColor Gray

Write-Host "✓ Archives created" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 5: Deploy Main Website
# ============================================================================
Write-Host "▶ Deploying main website to VPS..." -ForegroundColor Yellow

scp main-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" @"
    cd /tmp
    rm -rf ${MAIN_PATH}/*
    tar -xzf main-dist.tar.gz -C ${MAIN_PATH}
    rm main-dist.tar.gz
    echo 'Main website deployed'
"@

Write-Host "✓ Main website deployed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 6: Deploy YT Subdomain
# ============================================================================
Write-Host "▶ Deploying YT subdomain to VPS..." -ForegroundColor Yellow

scp yt-dist.tar.gz "${VPS_USER}@${VPS_IP}:/tmp/"
ssh "${VPS_USER}@${VPS_IP}" @"
    cd /tmp
    rm -rf ${YT_PATH}/frontend/*
    mkdir -p ${YT_PATH}/frontend
    tar -xzf yt-dist.tar.gz -C ${YT_PATH}/frontend
    rm yt-dist.tar.gz
    echo 'YT subdomain deployed'
"@

Write-Host "✓ YT subdomain deployed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 7: Deploy Backend
# ============================================================================
Write-Host "▶ Deploying backend..." -ForegroundColor Yellow

rsync -avz --delete `
    --exclude 'node_modules' `
    --exclude 'downloads' `
    --exclude 'logs' `
    --exclude '.env' `
    --exclude 'youtube_cookies.txt' `
    --exclude 'wgcf-account.toml' `
    yt/backend/ "${VPS_USER}@${VPS_IP}:${YT_PATH}/backend/"

ssh "${VPS_USER}@${VPS_IP}" @"
    cd ${YT_PATH}/backend
    docker-compose build
    docker-compose up -d
    echo 'Backend deployed and restarted'
"@

Write-Host "✓ Backend deployed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 8: Purge Cloudflare Cache
# ============================================================================
Write-Host "▶ Purging Cloudflare cache..." -ForegroundColor Yellow

if ($CF_ZONE_ID -and $CF_API_TOKEN) {
    $headers = @{
        "Authorization" = "Bearer $CF_API_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        "purge_everything" = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" `
            -Method Post `
            -Headers $headers `
            -Body $body
        
        if ($response.success) {
            Write-Host "✓ Cloudflare cache purged" -ForegroundColor Green
        } else {
            Write-Host "⚠ Cloudflare cache purge failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Cloudflare cache purge error: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Cloudflare credentials not set, skipping cache purge" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# Git operations removed - handle manually
# ============================================================================

# ============================================================================
# Deployment Complete
# ============================================================================
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete! - $Version" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Main Site:    https://retakt.cc" -ForegroundColor White
Write-Host "  YT Subdomain: https://yt.retakt.cc" -ForegroundColor White
Write-Host "  Admin Panel:  https://retakt.cc/admin/api-config" -ForegroundColor White
Write-Host ""
Write-Host "  Backend API:  https://yt.retakt.cc/api/health" -ForegroundColor White
Write-Host "  Admin API:    https://yt.retakt.cc/api/admin/status" -ForegroundColor White
Write-Host ""
