import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SystemStatus {
  cookies: {
    exists: boolean;
    ageInDays: number | null;
    needsRotation: boolean;
  };
  warp: {
    exists: boolean;
    ageInDays: number | null;
    currentIP: string | null;
  };
  timestamp: string;
}

interface CookieHealth {
  cookie: string;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  failureRate: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'new';
  lastUsed: number | null;
  lastUsedAgo: number | null;
  inCooldown: boolean;
  cooldownRemaining: number;
}

interface CookiePoolHealth {
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    new: number;
    inCooldown: number;
  };
  cookies: CookieHealth[];
}

interface SystemInfo {
  cookies: {
    total: number;
    health: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      new: number;
    };
    cooldownMs: number;
    failureThreshold: number;
  };
  cache: {
    totalCached: number;
    ttl: number;
  };
  config: {
    maxConcurrentDownloads: string;
    jobTimeoutMs: string;
    cookieCooldownMs: string;
    metadataCacheTTL: string;
  };
}

interface Stats {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  timestamp: string;
}

export default function Admin() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cookieHealth, setCookieHealth] = useState<CookiePoolHealth | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [cookieText, setCookieText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCookieHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies/health`, {
        headers: { 'X-Admin-Token': token },
      });
      if (res.ok) {
        const data = await res.json();
        setCookieHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch cookie health:', error);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/system/info`, {
        headers: { 'X-Admin-Token': token },
      });
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    }
  };

  const handleResetCookieHealth = async (cookieFile?: string) => {
    if (!confirm(cookieFile ? `Reset health stats for ${cookieFile}?` : 'Reset health stats for ALL cookies?')) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = cookieFile 
        ? `${API_URL}/api/admin/cookies/${cookieFile}/reset`
        : `${API_URL}/api/admin/cookies/reset-all`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'X-Admin-Token': token },
      });

      if (res.ok) {
        setMessage('✅ Health stats reset successfully');
        fetchCookieHealth();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to reset health stats');
      }
    } catch (error) {
      setMessage('❌ Failed to reset health stats');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear all cached video metadata?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cache/clear`, {
        method: 'POST',
        headers: { 'X-Admin-Token': token },
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`✅ Cleared ${data.count} cached entries`);
        fetchSystemInfo();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to clear cache');
      }
    } catch (error) {
      setMessage('❌ Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCookie = async (cookieFile: string) => {
    const countStr = prompt(`How many duplicates of ${cookieFile}?`, '5');
    if (!countStr) return;
    
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 1 || count > 50) {
      setMessage('❌ Invalid count (1-50)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies/${cookieFile}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify({ count }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`✅ Created ${data.duplicated.length} duplicates: ${data.duplicated.join(', ')}`);
        fetchCookieHealth();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ Failed to duplicate cookie');
      }
    } catch (error) {
      setMessage('❌ Failed to duplicate cookie');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCookie = async (cookieFile: string) => {
    if (!confirm(`Delete ${cookieFile}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies/${cookieFile}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': token },
      });

      if (res.ok) {
        setMessage(`✅ Deleted ${cookieFile}`);
        fetchCookieHealth();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to delete cookie');
      }
    } catch (error) {
      setMessage('❌ Failed to delete cookie');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      // Use system/info endpoint to validate admin token
      const res = await fetch(`${API_URL}/api/admin/system/info`, {
        headers: { 'X-Admin-Token': token },
      });
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', token);
        fetchStatus();
        fetchStats();
        fetchCookieHealth();
        fetchSystemInfo();
      } else {
        setMessage('Invalid token');
      }
    } catch (error) {
      setMessage('Failed to authenticate');
    }
  };

  const handleUploadCookies = async () => {
    if (!cookieText.trim()) {
      setMessage('Please paste cookies');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cookies: cookieText }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Cookies updated successfully! Worker will reload automatically.');
        setCookieText('');
        setTimeout(() => {
          fetchStatus();
          setMessage('');
        }, 3000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to upload cookies');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartWorker = async () => {
    if (!confirm('Restart worker to reload cookies and WARP connection?')) {
      return;
    }

    setLoading(true);
    setMessage('🔄 Restarting worker...');
    
    try {
      // Note: This requires SSH access or a restart endpoint
      // For now, show instructions
      setMessage('⚠️ To restart worker, run on VPS:\ncd /var/www/yt-downloader/backend && docker-compose restart worker');
    } catch (error) {
      setMessage('❌ Failed to restart worker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchStatus();
      fetchStats();
      fetchCookieHealth();
      fetchSystemInfo();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchStatus();
        fetchStats();
        fetchCookieHealth();
        fetchSystemInfo();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-white mb-6">Admin Login</h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin token"
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Login
          </button>
          {message && (
            <p className="mt-4 text-center text-red-400">{message}</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              localStorage.removeItem('adminToken');
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-4">🍪 Cookies Status</h2>
            {status?.cookies && (
              <div className="space-y-2">
                <p className="text-gray-300">
                  Status: {status.cookies.exists ? (
                    <span className="text-green-400">✅ Active</span>
                  ) : (
                    <span className="text-red-400">❌ Missing</span>
                  )}
                </p>
                {status.cookies.ageInDays !== null && (
                  <p className="text-gray-300">
                    Age: {status.cookies.ageInDays} days
                  </p>
                )}
                {status.cookies.needsRotation && (
                  <p className="text-yellow-400 font-semibold">
                    ⚠️ Rotation needed (7+ days old)
                  </p>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-4">🌐 WARP Status</h2>
            {status?.warp && (
              <div className="space-y-2">
                <p className="text-gray-300">
                  Status: {status.warp.exists ? (
                    <span className="text-green-400">✅ Connected</span>
                  ) : (
                    <span className="text-red-400">❌ Disconnected</span>
                  )}
                </p>
                {status.warp.currentIP && (
                  <p className="text-gray-300 text-sm break-all">
                    IP: {status.warp.currentIP}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Queue Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">📊 Queue Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{stats.queue.waiting}</p>
                <p className="text-gray-400">Waiting</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.queue.active}</p>
                <p className="text-gray-400">Active</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{stats.queue.completed}</p>
                <p className="text-gray-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{stats.queue.failed}</p>
                <p className="text-gray-400">Failed</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cookie Pool Health */}
        {cookieHealth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 mb-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">🍪 Cookie Pool Health</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (cookieHealth.cookies.length === 0) {
                      setMessage('❌ No cookies to duplicate');
                      return;
                    }
                    // Find best cookie (highest success rate)
                    const best = [...cookieHealth.cookies]
                      .filter(c => c.totalRequests > 0)
                      .sort((a, b) => {
                        const aRate = a.successCount / a.totalRequests;
                        const bRate = b.successCount / b.totalRequests;
                        return bRate - aRate;
                      })[0];
                    
                    if (best) {
                      handleDuplicateCookie(best.cookie);
                    } else {
                      // If no cookies have requests yet, duplicate first one
                      handleDuplicateCookie(cookieHealth.cookies[0].cookie);
                    }
                  }}
                  disabled={loading || !cookieHealth.cookies.length}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  📋 Duplicate Best
                </button>
                <button
                  onClick={() => handleResetCookieHealth()}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  🔄 Reset All Stats
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 text-center">
                <p className="text-2xl font-bold text-white">{cookieHealth.summary.total}</p>
                <p className="text-gray-400 text-sm">Total Cookies</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-green-700/50 text-center">
                <p className="text-2xl font-bold text-green-400">{cookieHealth.summary.healthy}</p>
                <p className="text-gray-400 text-sm">Healthy</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-yellow-700/50 text-center">
                <p className="text-2xl font-bold text-yellow-400">{cookieHealth.summary.degraded}</p>
                <p className="text-gray-400 text-sm">Degraded</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-red-700/50 text-center">
                <p className="text-2xl font-bold text-red-400">{cookieHealth.summary.unhealthy}</p>
                <p className="text-gray-400 text-sm">Unhealthy</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-blue-700/50 text-center">
                <p className="text-2xl font-bold text-blue-400">{cookieHealth.summary.inCooldown}</p>
                <p className="text-gray-400 text-sm">In Cooldown</p>
              </div>
            </div>

            {/* System Info */}
            {systemInfo && (
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Cooldown Period</p>
                    <p className="text-white font-semibold">{systemInfo.cookies.cooldownMs / 1000}s</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Failure Threshold</p>
                    <p className="text-white font-semibold">{(systemInfo.cookies.failureThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cached Videos</p>
                    <p className="text-white font-semibold">{systemInfo.cache.totalCached}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cache TTL</p>
                    <p className="text-white font-semibold">{systemInfo.cache.ttl / 60}m</p>
                  </div>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={loading}
                  className="mt-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-xs font-semibold rounded transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            )}

            {/* Cookie List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cookieHealth.cookies.map((cookie) => {
                const statusColors = {
                  healthy: 'border-green-700/50 bg-green-900/10',
                  degraded: 'border-yellow-700/50 bg-yellow-900/10',
                  unhealthy: 'border-red-700/50 bg-red-900/10',
                  new: 'border-blue-700/50 bg-blue-900/10',
                };

                const statusIcons = {
                  healthy: '✅',
                  degraded: '⚠️',
                  unhealthy: '❌',
                  new: '🆕',
                };

                return (
                  <div
                    key={cookie.cookie}
                    className={`bg-gray-900/30 rounded-lg p-4 border ${statusColors[cookie.status]}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{statusIcons[cookie.status]}</span>
                        <span className="text-white font-semibold">{cookie.cookie}</span>
                        {cookie.inCooldown && (
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                            Cooldown: {cookie.cooldownRemaining}s
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDuplicateCookie(cookie.cookie)}
                          disabled={loading}
                          className="px-2 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 text-white text-xs rounded transition-colors"
                          title="Duplicate this cookie"
                        >
                          📋 Duplicate
                        </button>
                        <button
                          onClick={() => handleResetCookieHealth(cookie.cookie)}
                          disabled={loading}
                          className="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-800 text-white text-xs rounded transition-colors"
                          title="Reset health stats"
                        >
                          🔄 Reset
                        </button>
                        <button
                          onClick={() => handleDeleteCookie(cookie.cookie)}
                          disabled={loading}
                          className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 text-white text-xs rounded transition-colors"
                          title="Delete this cookie"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Success Rate</p>
                        <p className="text-white font-semibold">
                          {cookie.totalRequests > 0
                            ? ((cookie.successCount / cookie.totalRequests) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Requests</p>
                        <p className="text-white font-semibold">
                          {cookie.successCount} / {cookie.totalRequests}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Failures</p>
                        <p className="text-white font-semibold">{cookie.failureCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Last Used</p>
                        <p className="text-white font-semibold">
                          {cookie.lastUsedAgo !== null
                            ? cookie.lastUsedAgo < 60
                              ? `${cookie.lastUsedAgo}s ago`
                              : `${Math.floor(cookie.lastUsedAgo / 60)}m ago`
                            : 'Never'}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar for failure rate */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            cookie.failureRate > 0.3
                              ? 'bg-red-500'
                              : cookie.failureRate > 0.15
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${(1 - cookie.failureRate) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {cookieHealth.cookies.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg mb-2">No cookies in pool</p>
                <p className="text-sm">Add cookie files to /opt/yt-downloader/api/cookies/</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Cookie Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Add Cookies to Pool</h2>
            <button
              onClick={handleRestartWorker}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              🔄 Restart Worker
            </button>
          </div>
          <p className="text-gray-400 mb-4">
            Add multiple YouTube account cookies to the pool. System automatically rotates between them.
            <strong className="text-white"> Recommended: 10-20 cookies for production.</strong>
          </p>
          
          {/* How to Export Cookies */}
          <details className="mb-4 bg-gray-900/30 rounded-lg p-3 border border-gray-700">
            <summary className="cursor-pointer text-sm font-semibold text-gray-300 hover:text-white">
              📖 How to add cookies to pool
            </summary>
            <div className="mt-3 text-sm text-gray-400 space-y-2">
              <p><strong className="text-white">Step 1:</strong> Install browser extension:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Chrome/Edge: <a href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank" className="text-blue-400 hover:underline">Get cookies.txt LOCALLY</a></li>
                <li>Firefox: <a href="https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/" target="_blank" className="text-blue-400 hover:underline">cookies.txt</a></li>
              </ul>
              <p><strong className="text-white">Step 2:</strong> For each YouTube account:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Log into YouTube in browser</li>
                <li>Click extension → Export → Save as .txt file</li>
                <li>Name files: cookie_001.txt, cookie_002.txt, etc.</li>
              </ul>
              <p><strong className="text-white">Step 3:</strong> Upload to server:</p>
              <div className="bg-gray-900/50 rounded p-2 font-mono text-xs mt-2">
                scp cookie_*.txt user@server:/opt/yt-downloader/api/cookies/
              </div>
              <p><strong className="text-white">Step 4:</strong> Restart services to load new cookies</p>
              <p className="text-yellow-400 mt-2">💡 The more cookies you add, the more stable your service will be!</p>
            </div>
          </details>

          <textarea
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
            placeholder="# Netscape HTTP Cookie File&#10;.youtube.com    TRUE    /    TRUE    ..."
            className="w-full h-48 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4 font-mono text-sm"
          />
          <button
            onClick={handleUploadCookies}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Cookies'}
          </button>
          {message && (
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <p className="text-center text-white whitespace-pre-line">{message}</p>
            </div>
          )}
        </motion.div>

        {/* WARP Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 mt-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">🌐 WARP Management</h2>
          <p className="text-gray-400 mb-4">
            WARP credentials are configured in docker-compose.yml. To regenerate:
          </p>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 font-mono text-sm text-gray-300 space-y-2">
            <p className="text-yellow-400"># On your VPS:</p>
            <p>cd /var/www/yt-downloader/backend</p>
            <p>docker run --rm -v $(pwd):/output ghcr.io/viktorstrate/wg-cloudflare-warp:latest</p>
            <p className="text-gray-500"># This generates wgcf-profile.conf</p>
            <p className="mt-3 text-yellow-400"># Update docker-compose.yml with new keys</p>
            <p>docker-compose restart gluetun worker</p>
          </div>
          <p className="text-gray-400 mt-4 text-sm">
            💡 WARP credentials rarely need rotation. Only regenerate if connection fails.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
