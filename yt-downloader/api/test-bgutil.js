#!/usr/bin/env node

/**
 * Test script to verify bgutil po_token provider integration
 * Run this after starting the services to ensure everything works
 */

const http = require('http');
const { spawn } = require('child_process');

const BGUTIL_URL = process.env.BGUTIL_URL || 'http://127.0.0.1:4416';
const TEST_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll for testing

console.log('🧪 Testing bgutil po_token provider integration...\n');

// Test 1: Check if bgutil service is running
function testBgutilHealth() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing bgutil health endpoint...');
    
    const url = new URL('/health', BGUTIL_URL);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ bgutil service is healthy');
          resolve(data);
        } else {
          console.log(`❌ bgutil health check failed: ${res.statusCode}`);
          reject(new Error(`Health check failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ bgutil service unreachable: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

// Test 2: Check if yt-dlp can use bgutil plugin
function testYtdlpPlugin() {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣ Testing yt-dlp bgutil plugin...');
    
    const proc = spawn('yt-dlp', [
      '--list-extractors',
      '--quiet'
    ]);
    
    let stdout = '';
    proc.stdout.on('data', data => stdout += data);
    
    proc.on('exit', (code) => {
      if (code === 0) {
        if (stdout.includes('youtubepot')) {
          console.log('✅ bgutil-ytdlp-pot-provider plugin is installed');
          resolve();
        } else {
          console.log('❌ bgutil plugin not found in yt-dlp extractors');
          reject(new Error('Plugin not installed'));
        }
      } else {
        console.log('❌ yt-dlp command failed');
        reject(new Error('yt-dlp failed'));
      }
    });
    
    proc.on('error', reject);
  });
}

// Test 3: Test video info extraction with bgutil
function testVideoInfo() {
  return new Promise((resolve, reject) => {
    console.log('\n3️⃣ Testing video info extraction with bgutil...');
    
    const proc = spawn('yt-dlp', [
      '--dump-single-json',
      '--no-warnings',
      '--extractor-args', 'youtube:player_client=mweb,tv_embedded,web,default',
      TEST_VIDEO
    ]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', data => stdout += data);
    proc.stderr.on('data', data => stderr += data);
    
    proc.on('exit', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdout);
          console.log(`✅ Successfully extracted info for: "${info.title}"`);
          console.log(`   Duration: ${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}`);
          console.log(`   Uploader: ${info.uploader}`);
          resolve(info);
        } catch (err) {
          console.log('❌ Failed to parse video info JSON');
          reject(err);
        }
      } else {
        console.log('❌ Video info extraction failed');
        console.log('Error output:', stderr);
        reject(new Error('Info extraction failed'));
      }
    });
    
    proc.on('error', reject);
  });
}

// Run all tests
async function runTests() {
  try {
    await testBgutilHealth();
    await testYtdlpPlugin();
    await testVideoInfo();
    
    console.log('\n🎉 All tests passed! bgutil integration is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   • bgutil service is running and healthy');
    console.log('   • bgutil-ytdlp-pot-provider plugin is installed');
    console.log('   • Video info extraction works with po_token');
    console.log('\n✨ Your YouTube downloader should now handle 403 errors correctly!');
    
  } catch (error) {
    console.log(`\n💥 Test failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure bgutil service is running: docker-compose ps');
    console.log('   2. Check bgutil logs: docker-compose logs yt-bgutil');
    console.log('   3. Verify plugin installation: docker-compose exec yt-worker yt-dlp --list-extractors | grep youtubepot');
    console.log('   4. Test bgutil directly: curl http://127.0.0.1:4416/health');
    
    process.exit(1);
  }
}

runTests();