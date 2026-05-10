#!/usr/bin/env node
/**
 * Ollama Model Warmup Service
 * 
 * Keeps your Ollama model loaded in memory to eliminate cold start delays.
 * 
 * Strategy:
 * - Warmup inference every 15 seconds (aggressive, prevents any unload)
 * - Ultra-minimal prompt (just "ping")
 * - No system prompt manipulation (let model respond naturally)
 * - think: false (no reasoning overhead)
 * - Extremely low token generation (num_predict: 1)
 * 
 * Usage:
 *   node warmup-service.js
 * 
 * Environment variables:
 *   OLLAMA_URL - Ollama server URL (default: http://localhost:11434)
 *   MODEL_ID - Model to keep warm (default: joe-speedboat/Gemma-4-Uncensored-HauhauCS-Aggressive:e4b)
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "https://chat-api.retakt.cc";
const MODEL_ID = process.env.MODEL_ID || "joe-speedboat/Gemma-4-Uncensored-HauhauCS-Aggressive:e4b";

// Aggressive 15-second interval
const WARMUP_INTERVAL = 15 * 1000; // 15 seconds

// Stats
const stats = {
  warmups: { success: 0, failed: 0, lastWarmup: null, avgResponseTime: 0, totalResponseTime: 0 },
  modelStatus: "unknown",
  startTime: new Date(),
};

/**
 * Ultra-minimal warmup inference
 * 
 * Parameters optimized for speed:
 * - think: false → No reasoning overhead
 * - num_predict: 1 → Generate only 1 token
 * - num_ctx: 128 → Absolute minimum context
 * - temperature: 0 → Deterministic (fastest)
 * - top_k: 1 → No sampling overhead
 * - top_p: 1 → No nucleus sampling
 * 
 * No system prompt - just raw "ping" message
 */
async function warmupInference() {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: "user",
            content: "ping",
          },
        ],
        stream: false,
        think: false, // CRITICAL: No thinking mode
        keep_alive: -1, // Keep model loaded indefinitely
        options: {
          num_ctx: 128, // Absolute minimum context
          temperature: 0, // Deterministic
          num_predict: 1, // Generate only 1 token
          top_k: 1, // No sampling overhead
          top_p: 1.0, // No nucleus sampling
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      stats.warmups.success++;
      stats.warmups.lastWarmup = new Date();
      stats.warmups.totalResponseTime += responseTime;
      stats.warmups.avgResponseTime = Math.round(stats.warmups.totalResponseTime / stats.warmups.success);
      stats.modelStatus = "loaded";
      
      const responseText = data.message?.content?.trim() || '';
      console.log(`[${new Date().toLocaleTimeString()}] ✓ Warmup ${stats.warmups.success} | ${responseTime}ms | Avg: ${stats.warmups.avgResponseTime}ms | Response: "${responseText}"`);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    stats.warmups.failed++;
    stats.warmups.lastWarmup = new Date();
    stats.modelStatus = "error";
    console.error(`[${new Date().toLocaleTimeString()}] ✗ Warmup failed (${responseTime}ms):`, error.message);
    return false;
  }
}

/**
 * Check if model is currently loaded using /api/ps endpoint
 */
async function checkModelLoaded() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/ps`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const isLoaded = data.models?.some(m => m.name === MODEL_ID || m.model === MODEL_ID);
      stats.modelStatus = isLoaded ? "loaded" : "unloaded";
      return isLoaded;
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ✗ Model check failed:`, error.message);
  }
  return false;
}

/**
 * Get current stats
 */
function getStats() {
  const uptime = Math.floor((Date.now() - stats.startTime.getTime()) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  return {
    ...stats,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeSeconds: uptime,
  };
}

/**
 * Print stats summary
 */
function printStats() {
  const s = getStats();
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    Warmup Service Stats                        ║
╠════════════════════════════════════════════════════════════════╣
║  Uptime: ${s.uptime.padEnd(52)} ║
║  Model Status: ${s.modelStatus.padEnd(48)} ║
║                                                                ║
║  Warmup Inferences:                                            ║
║    Success: ${String(s.warmups.success).padEnd(50)} ║
║    Failed: ${String(s.warmups.failed).padEnd(51)} ║
║    Avg Response Time: ${String(s.warmups.avgResponseTime + 'ms').padEnd(41)} ║
║                                                                ║
║  Interval: Every 15 seconds                                    ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Start the warmup service
 */
async function start() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Ollama Model Warmup Service Started                  ║
╠════════════════════════════════════════════════════════════════╣
║  Ollama URL: ${OLLAMA_URL.padEnd(48)} ║
║  Model: ${MODEL_ID.substring(0, 53).padEnd(53)} ║
║                                                                ║
║  Warmup Interval: Every 15 seconds (aggressive)                ║
║  Strategy: Ultra-minimal inference (1 token, no thinking)      ║
║                                                                ║
║  Press Ctrl+C to stop                                          ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Initial check
  console.log(`[${new Date().toLocaleTimeString()}] Checking if model is loaded...`);
  const isLoaded = await checkModelLoaded();
  
  if (isLoaded) {
    console.log(`[${new Date().toLocaleTimeString()}] ✓ Model already loaded in memory`);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] Model not loaded. Triggering initial warmup...`);
  }

  // Trigger first warmup immediately
  await warmupInference();

  // Start periodic warmup inference every 15 seconds
  setInterval(async () => {
    await warmupInference();
  }, WARMUP_INTERVAL);

  // Print stats every 5 minutes
  setInterval(() => {
    printStats();
  }, 5 * 60 * 1000);

  console.log(`[${new Date().toLocaleTimeString()}] ✓ Warmup service is now running`);
  console.log(`[${new Date().toLocaleTimeString()}] Model will stay loaded and respond instantly\n`);
}

// Graceful shutdown (PM2 compatible)
function gracefulShutdown(signal) {
  console.log(`\n[${new Date().toLocaleTimeString()}] Received ${signal}, shutting down warmup service...`);
  printStats();
  
  // Give PM2 time to log stats before exiting
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// PM2 graceful reload support
process.on("message", (msg) => {
  if (msg === "shutdown") {
    gracefulShutdown("PM2 shutdown");
  }
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error(`[${new Date().toLocaleTimeString()}] Uncaught exception:`, error);
});

process.on("unhandledRejection", (error) => {
  console.error(`[${new Date().toLocaleTimeString()}] Unhandled rejection:`, error);
});

// Start the service
start().catch((error) => {
  console.error(`[${new Date().toLocaleTimeString()}] Fatal error:`, error);
  process.exit(1);
});
