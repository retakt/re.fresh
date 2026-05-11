const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const execPromise = util.promisify(exec);
const IP_FILE = path.join(__dirname, '../../logs/warp-ip.txt');

/**
 * Get current IP address
 */
async function getCurrentIP() {
  try {
    const { stdout } = await execPromise('wget -qO- --timeout=5 https://cloudflare.com/cdn-cgi/trace 2>/dev/null | grep "ip=" | cut -d= -f2');
    return stdout.trim();
  } catch (error) {
    logger.error('Failed to get current IP', { error: error.message });
    return null;
  }
}

/**
 * Write IP to shared file (called by worker)
 */
async function writeWorkerIP() {
  try {
    const ip = await getCurrentIP();
    if (ip) {
      await fs.writeFile(IP_FILE, ip, 'utf8');
      logger.info('Worker IP written to file', { ip });
    }
  } catch (error) {
    logger.error('Failed to write worker IP', { error: error.message });
  }
}

/**
 * Read worker IP from shared file (called by API)
 */
async function readWorkerIP() {
  try {
    const ip = await fs.readFile(IP_FILE, 'utf8');
    return ip.trim();
  } catch (error) {
    // File doesn't exist or can't be read
    return null;
  }
}

module.exports = {
  getCurrentIP,
  writeWorkerIP,
  readWorkerIP,
};
