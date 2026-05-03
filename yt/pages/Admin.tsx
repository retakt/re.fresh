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
        const data = await setStatus(await res.json());
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
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', token);
        fetchStatus();
        fetchStats();
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
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchStatus();
        fetchStats();
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

        {/* Cookie Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Upload New Cookies</h2>
            <button
              onClick={handleRestartWorker}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              🔄 Restart Worker
            </button>
          </div>
          <p className="text-gray-400 mb-4">
            Paste YouTube cookies in Netscape format. Rotate weekly for best results.
          </p>
          
          {/* How to Export Cookies */}
          <details className="mb-4 bg-gray-900/30 rounded-lg p-3 border border-gray-700">
            <summary className="cursor-pointer text-sm font-semibold text-gray-300 hover:text-white">
              📖 How to export cookies
            </summary>
            <div className="mt-3 text-sm text-gray-400 space-y-2">
              <p><strong className="text-white">Step 1:</strong> Install browser extension:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Chrome/Edge: <a href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank" className="text-blue-400 hover:underline">Get cookies.txt LOCALLY</a></li>
                <li>Firefox: <a href="https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/" target="_blank" className="text-blue-400 hover:underline">cookies.txt</a></li>
              </ul>
              <p><strong className="text-white">Step 2:</strong> Go to youtube.com (logged in)</p>
              <p><strong className="text-white">Step 3:</strong> Click extension → Export → Copy</p>
              <p><strong className="text-white">Step 4:</strong> Paste below and upload</p>
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
