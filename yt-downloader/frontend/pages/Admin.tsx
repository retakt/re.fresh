  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Cookie, 
  Wifi, 
  BarChart3, 
  RefreshCw, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Upload,
  LogOut
} from 'lucide-react';
import { SettingsIcon } from '../components/animate-ui/icons/settings';
import { StarsBackground } from '../components/backgrounds/stars';

interface SystemStatus {
  cookies: { exists: boolean; ageInDays: number | null; needsRotation: boolean };
  warp: { exists: boolean; ageInDays: number | null; currentIP: string | null };
  timestamp: string;
}
interface CookieHealth {
  cookie: string; successCount: number; failureCount: number; totalRequests: number;
  failureRate: number; status: 'healthy' | 'degraded' | 'unhealthy' | 'new';
  lastUsed: number | null; lastUsedAgo: number | null; inCooldown: boolean; cooldownRemaining: number;
}
interface CookiePoolHealth {
  summary: { total: number; healthy: number; degraded: number; unhealthy: number; new: number; inCooldown: number };
  cookies: CookieHealth[];
}
interface SystemInfo {
  cookies: { total: number; health: { total: number; healthy: number; degraded: number; unhealthy: number; new: number }; cooldownMs: number; failureThreshold: number };
  cache: { totalCached: number; ttl: number };
  config: { maxConcurrentDownloads: string; jobTimeoutMs: string; cookieCooldownMs: string; metadataCacheTTL: string };
}
interface Stats {
  queue: { waiting: number; active: number; completed: number; failed: number };
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

  // API_URL is the root (no /api suffix) — all admin routes append /api/admin/...
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

  const fetchStatus = async (t = token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/status`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setStatus(await res.json());
    } catch {}
  };
  const fetchStats = async (t = token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setStats(await res.json());
    } catch {}
  };
  const fetchCookieHealth = async (t = token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies/health`, { headers: { 'X-Admin-Token': t } });
      if (res.ok) setCookieHealth(await res.json());
    } catch {}
  };
  const fetchSystemInfo = async (t = token) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/system/info`, { headers: { 'X-Admin-Token': t } });
      if (res.ok) setSystemInfo(await res.json());
    } catch {}
  };

  const handleResetCookieHealth = async (cookieFile?: string) => {
    if (!confirm(cookieFile ? `reset ${cookieFile}?` : 'reset all cookies?')) return;
    setLoading(true);
    try {
      const endpoint = cookieFile ? `${API_URL}/api/admin/cookies/${cookieFile}/reset` : `${API_URL}/api/admin/cookies/reset-all`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'X-Admin-Token': token } });
      if (res.ok) { setMessage('✓ reset'); fetchCookieHealth(); setTimeout(() => setMessage(''), 2000); }
      else setMessage('✗ failed');
    } catch { setMessage('✗ failed'); } finally { setLoading(false); }
  };

  const handleClearCache = async () => {
    if (!confirm('clear all cached metadata?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cache/clear`, { method: 'POST', headers: { 'X-Admin-Token': token } });
      if (res.ok) { const d = await res.json(); setMessage(`✓ cleared ${d.count}`); fetchSystemInfo(); setTimeout(() => setMessage(''), 2000); }
      else setMessage('✗ failed');
    } catch { setMessage('✗ failed'); } finally { setLoading(false); }
  };

  const handleDuplicateCookie = async (cookieFile: string) => {
    const countStr = prompt(`how many duplicates of ${cookieFile}?`, '5');
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 1 || count > 50) { setMessage('✗ invalid (1-50)'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies/${cookieFile}/duplicate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: JSON.stringify({ count }),
      });
      if (res.ok) { const d = await res.json(); setMessage(`✓ +${d.duplicated.length}`); fetchCookieHealth(); setTimeout(() => setMessage(''), 2000); }
      else setMessage('✗ failed');
    } catch { setMessage('✗ failed'); } finally { setLoading(false); }
  };

  const handleDeleteCookie = async (cookieFile: string) => {
    if (!confirm(`delete ${cookieFile}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies/${cookieFile}`, { method: 'DELETE', headers: { 'X-Admin-Token': token } });
      if (res.ok) { setMessage('✓ deleted'); fetchCookieHealth(); setTimeout(() => setMessage(''), 2000); }
      else setMessage('✗ failed');
    } catch { setMessage('✗ failed'); } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/system/info`, { headers: { 'X-Admin-Token': token } });
      if (res.ok) {
        setIsAuthenticated(true); localStorage.setItem('adminToken', token);
        fetchStatus(token); fetchStats(token); fetchCookieHealth(token); fetchSystemInfo(token);
      } else setMessage('invalid token');
    } catch { setMessage('failed to authenticate'); }
  };

  const handleUploadCookies = async () => {
    if (!cookieText.trim()) { setMessage('please paste cookies'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cookies`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cookies: cookieText }),
      });
      const data = await res.json();
      if (res.ok) { setMessage('✓ cookies updated!'); setCookieText(''); setTimeout(() => { fetchStatus(); setMessage(''); }, 3000); }
      else setMessage(`✗ ${data.error}`);
    } catch { setMessage('✗ failed'); } finally { setLoading(false); }
  };

  useEffect(() => {
    const saved = localStorage.getItem('adminToken');
    if (saved) { setToken(saved); setIsAuthenticated(true); fetchStatus(saved); fetchStats(saved); fetchCookieHealth(saved); fetchSystemInfo(saved); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => { fetchStatus(); fetchStats(); fetchCookieHealth(); fetchSystemInfo(); }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-mono">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[11px] p-6 max-w-md w-full">
          <h1 className="text-[14px] lg:text-[18px] font-bold text-zinc-400 mb-4">y0utubed! v1.0.3</h1>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="enter admin token"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[9px] text-white text-[13px] placeholder-[#555] focus:outline-none focus:border-[#ed2236] mb-3" />
          <button onClick={handleLogin} className="w-full px-4 py-3 bg-[#ed2236] hover:bg-[#d61c2e] text-zinc-300 text-[13px] font-semibold rounded-[9px] transition-colors">
            authenticate!
          </button>
          {message && <p className="mt-3 text-center text-[#ed2236] text-[11px] lg:text-[13px]">{message}</p>}
        </motion.div>
      </div>
    );
  }

  const statusColors = { 
    healthy: 'text-green-400', 
    degraded: 'text-yellow-400', 
    unhealthy: 'text-red-400', 
    new: 'text-sky-400' 
  };

  const StatusIndicator = ({ status, size = 8 }: { status: string; size?: number }) => {
    const colors = {
      healthy: 'bg-green-500 shadow-green-500/30',
      degraded: 'bg-yellow-500 shadow-yellow-500/30',
      unhealthy: 'bg-red-500 shadow-red-500/30',
      new: 'bg-sky-500 shadow-sky-500/30',
      connected: 'bg-green-500 shadow-green-500/30',
      disconnected: 'bg-red-500 shadow-red-500/30',
      checking: 'bg-yellow-500 shadow-yellow-500/30'
    };
    
    const colorClass = colors[status as keyof typeof colors] || 'bg-gray-500';
    
    return (
      <div
        className={cn(
          `w-${size/4} h-${size/4} rounded-full shadow-md animate-pulse`,
          colorClass
        )}
        style={{
          boxShadow: `0 0 ${size/2}px ${colorClass.includes('green') ? 'rgba(34, 197, 94, 0.3)' :
                                      colorClass.includes('yellow') ? 'rgba(234, 179, 8, 0.3)' :
                                      colorClass.includes('red') ? 'rgba(239, 68, 68, 0.3)' :
                                      colorClass.includes('sky') ? 'rgba(14, 165, 233, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
        }}
      />
    );
  };

  const AnimatedRefreshIcon = ({ isRefreshing }: { isRefreshing: boolean }) => (
    <motion.div
      animate={isRefreshing ? { rotate: 360 } : {}}
      transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
    >
      <RefreshCw size={12} />
    </motion.div>
  );

return (
  <div className="min-h-screen bg-black/10 text-white font-mono flex flex-col overflow-x-hidden lg:h-screen lg:overflow-hidden relative">
    <StarsBackground
      className="absolute inset-0 z-0 pointer-events-none"
      starColor="#525252"
      factor={0.05}
      speed={50}
      pointerEvents={false}
    />

    {/* ── Header ── */}
    <div className="flex items-center justify-between px-2 xl:px-12 py-2 border-b border-white/10 shrink-0 relative z-10 bg-black/50">
      <div className="flex items-center gap-2 min-w-0">
        <SettingsIcon size={15} className="text-[#ed2236] shrink-0" />
        
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-bold lowercase whitespace-nowrap">
            admin dashboard
          </span>

          <span className="text-[10px] lg:text-[12px] text-zinc-400 lowercase truncate hidden sm:block">
            y0uTubed v1.0.3
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {message && (
          <span className="hidden sm:block text-[10px] lg:text-[12px] text-[#666] px-2 py-1 bg-white/5 border border-white/10 rounded-[6px] lowercase">
            {message}
          </span>
        )}

        <button
          onClick={() => {
            setIsAuthenticated(false);
            localStorage.removeItem('adminToken');
          }}
          className="flex items-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] lg:text-[13px] rounded-[6px] transition-colors lowercase"
        >
          <LogOut size={11} />
          logout
        </button>
      </div>
    </div>

    {/* ── Main Layout ── */}
    <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden p-1 xl:px-12 xl:py-2 gap-1 lg:gap-2 relative z-10">

      {/* ───────────────────────────────────────────── */}
      {/* LEFT SIDE */}
      {/* ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 lg:overflow-hidden gap-1 lg:gap-2">

        {/* Pool Header */}
        <div className="bg-transparent border border-white/10 rounded-[7px] p-1.5 lg:p-2.5 shrink-0">

          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">

            <div className="flex items-center gap-1.5 lg:p-2.5">
              <Cookie size={15} className="text-[#ed2236]" />
              <span className="text-[13px] lg:text-[15px] font-bold lowercase">
                cookie pool health
              </span>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (!cookieHealth?.cookies.length) return;

                  const best = [...cookieHealth.cookies]
                    .filter(c => c.totalRequests > 0)
                    .sort(
                      (a, b) =>
                        b.successCount / b.totalRequests -
                        a.successCount / a.totalRequests
                    )[0];

                  handleDuplicateCookie(
                    best
                      ? best.cookie
                      : cookieHealth.cookies[0].cookie
                  );
                }}
                disabled={loading || !cookieHealth?.cookies.length}
                className="flex items-center gap-1 px-2 py-1 bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 text-green-400 text-[10px] lg:text-[12px] rounded-[6px] transition-colors disabled:opacity-30 lowercase"
              >
                <Copy size={9} />
                dup best
              </button>

              <button
                onClick={() => handleResetCookieHealth()}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/20 text-yellow-400 text-[10px] lg:text-[12px] rounded-[6px] transition-colors lowercase"
              >
                <AnimatedRefreshIcon isRefreshing={loading} />
                reset
              </button>
            </div>
          </div>

          {/* Stats + System */}
          <div className="flex flex-col lg:flex-row gap-2 items-stretch">

            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1 lg:gap-2 lg:w-[40%]">

              {[
                {
                  label: 'total',
                  val: cookieHealth?.summary.total ?? 0,
                  color: 'text-white',
                  border: 'border-[#1f1f1f]',
                  icon: BarChart3,
                },
                {
                  label: 'healthy',
                  val: cookieHealth?.summary.healthy ?? 0,
                  color: 'text-green-400',
                  border: 'border-green-600/20',
                  icon: CheckCircle,
                },
                {
                  label: 'degraded',
                  val: cookieHealth?.summary.degraded ?? 0,
                  color: 'text-yellow-400',
                  border: 'border-yellow-600/20',
                  icon: AlertTriangle,
                },
                {
                  label: 'unhealthy',
                  val: cookieHealth?.summary.unhealthy ?? 0,
                  color: 'text-red-400',
                  border: 'border-red-600/20',
                  icon: XCircle,
                },
                {
                  label: 'new',
                  val: cookieHealth?.summary.new ?? 0,
                  color: 'text-sky-400',
                  border: 'border-sky-600/20',
                  icon: Zap,
                },
                {
                  label: 'cooldown',
                  val: cookieHealth?.summary.inCooldown ?? 0,
                  color: 'text-blue-400',
                  border: 'border-blue-600/20',
                  icon: Clock,
                },
              ].map(({ label, val, color, border, icon: Icon }) => (
                <div
                  key={label}
                  className={cn(
                    'bg-transparent border rounded-[8px] p-1.5 lg:p-2.5 flex flex-col items-center justify-center min-h-[58px] lg:min-h-[96px] p-1 flex flex-col items-center justify-center',
                    border
                  )}
                >
                  <Icon size={18} className={cn('mb-1', color)} />

                  <div className={cn('text-[16px] lg:text-[20px] font-bold leading-none', color)}>
                    {val}
                  </div>

                  <div className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 font-semibold">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* System Info */}
            {systemInfo && (
              <div className="lg:w-[60%] bg-white/5 border border-white/10 rounded-[8px] p-2.5 flex flex-col justify-between">
                <div className="space-y-1 text-[10px] lg:text-[12px]">

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 lowercase">
                      cooldown
                    </span>

                    <span className="font-bold">
                      {systemInfo.cookies.cooldownMs / 1000}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 lowercase">
                      threshold
                    </span>

                    <span className="font-bold">
                      {(systemInfo.cookies.failureThreshold * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 lowercase">
                      cached
                    </span>

                    <span className="font-bold">
                      {systemInfo.cache.totalCached}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 lowercase">
                      ttl
                    </span>

                    <span className="font-bold">
                      {systemInfo.cache.ttl / 60}m
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleClearCache}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-transparent hover:bg-[#ed2236]/20 border border-[#ed2236]/20 text-[#ed2236] text-[10px] lg:text-[12px] rounded-[6px] transition-colors lowercase mt-2"
                >
                  <Trash2 size={9} />
                  clear cache
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cookie List */}
        <div className="flex flex-col gap-1 md:flex-1 md:overflow-y-auto custom-scrollbar min-h-0">

          {cookieHealth?.cookies.map((cookie) => (
            <div
              key={cookie.cookie}
              className="bg-transparent backdrop-blur-sm border border-white/10 rounded-[6px] px-1.5 py-1 lg:px-2 lg:py-1.5"
            >
              <div className="flex items-center justify-between mb-1 min-w-0">

                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  <StatusIndicator status={cookie.status} size={8} />

                  <span
                    className={cn(
                      'text-[11px] lg:text-[13px] font-mono lowercase truncate',
                      statusColors[cookie.status]
                    )}
                  >
                    {cookie.cookie}
                  </span>
                </div>

                <div className="flex gap-0.5 shrink-0 items-center">

                  <button
                    onClick={() =>
                      handleDuplicateCookie(cookie.cookie)
                    }
                    disabled={loading}
                    className="flex items-center justify-center w-6 h-6 hover:bg-white/10 rounded text-zinc-400 hover:text-green-400 transition-colors"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    onClick={() =>
                      handleResetCookieHealth(cookie.cookie)
                    }
                    disabled={loading}
                    className="flex items-center justify-center w-6 h-6 hover:bg-white/10 rounded text-zinc-400 hover:text-yellow-400 transition-colors"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteCookie(cookie.cookie)
                    }
                    disabled={loading}
                    className="flex items-center justify-center w-6 h-6 hover:bg-white/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-0.5 text-[10px] mb-1 items-center">

                <div className="flex items-center gap-0.5">
                  <span className="text-zinc-400 lowercase text-[10px]">
                    rate:
                  </span>
                  <span className="text-white text-[10px]">
                    {cookie.totalRequests > 0
                      ? (
                          (cookie.successCount /
                            cookie.totalRequests) *
                          100
                        ).toFixed(0)
                      : 0}
                      %
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <span className="text-zinc-400 lowercase text-[10px]">
                    req:
                  </span>
                  <span className="text-white text-[10px]">
                    {cookie.successCount}/
                    {cookie.totalRequests}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <span className="text-zinc-400 lowercase text-[10px]">
                    fail:
                  </span>
                  <span className="text-white text-[10px]">
                    {cookie.failureCount}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <span className="text-zinc-400 lowercase text-[10px]">
                    used:
                  </span>
                  <span className="text-white text-[10px]">
                    {cookie.lastUsedAgo !== null
                      ? cookie.lastUsedAgo < 60
                        ? `${cookie.lastUsedAgo}s`
                        : `${Math.floor(cookie.lastUsedAgo / 60)}m`
                      : 'never'}
                  </span>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-[2px]">
                <div
                  className={cn(
                    'h-[2px] rounded-full transition-all',
                    cookie.failureRate > 0.3
                      ? 'bg-red-500'
                      : cookie.failureRate > 0.15
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  )}
                  style={{
                    width: `${(1 - cookie.failureRate) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────── */}
      {/* RIGHT SIDE */}
      {/* ───────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-1 lg:gap-2">

        {/* Cookies Status */}
        <div className="bg-transparent border border-white/10 rounded-[7px] p-1.5 lg:p-2.5">
          <div className="flex items-center gap-1.5 lg:p-2.5 mb-1">
            <Cookie size={12} className="text-[#ed2236]" />
            <h2 className="text-[13px] lg:text-[15px] font-bold lowercase">
              cookies status
            </h2>
          </div>

          {status?.cookies ? (
            <div className="space-y-1 text-[10px] lg:text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 lowercase">
                  status
                </span>

                <div className="flex items-center gap-1">
                  <StatusIndicator
                    status={
                      status.cookies.exists
                        ? 'connected'
                        : 'disconnected'
                    }
                    size={6}
                  />

                  <span
                    className={
                      status.cookies.exists
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {status.cookies.exists
                      ? 'active'
                      : 'missing'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400 text-[10px] lg:text-[12px]">
              <Loader2 size={10} className="animate-spin" />
              loading...
            </div>
          )}
        </div>

        {/* Warp */}
        <div className="bg-transparent border border-white/10 rounded-[7px] p-1.5 lg:p-2.5">
          <div className="flex items-center gap-1.5 lg:p-2.5 mb-1">
            <Wifi size={14} className="text-[#ed2236]" />
            <h2 className="text-[13px] lg:text-[15px] font-bold lowercase">
              warp status
            </h2>
          </div>

          {status?.warp ? (
            <div className="space-y-1 text-[10px] lg:text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 lowercase">
                  status
                </span>

                <div className="flex items-center gap-1">
                  <StatusIndicator
                    status={
                      status.warp.exists
                        ? 'connected'
                        : 'disconnected'
                    }
                    size={6}
                  />

                  <span
                    className={
                      status.warp.exists
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {status.warp.exists
                      ? 'connected'
                      : 'offline'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400 text-[10px] lg:text-[12px]">
              <Loader2 size={10} className="animate-spin" />
              loading...
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="bg-transparent border border-white/10 rounded-[7px] p-1.5 lg:p-2.5 flex flex-col">

          <div className="flex items-center gap-1.5 lg:p-2.5 mb-1">
            <Upload size={14} className="text-[#ed2236]" />

            <h2 className="text-[13px] lg:text-[15px] font-bold lowercase">
              add cookies
            </h2>
          </div>

          <p className="text-[13px] text-zinc-400 mb-2 lowercase leading-relaxed">
            paste netscape cookie file. system rotates automatically.
            <span className="text-zinc-200 font-semibold">
              {' '}10-20 recommended.
            </span>
          </p>

          <textarea
            value={cookieText}
            onChange={(e) => setCookieText(e.target.value)}
            placeholder={'# Netscape HTTP Cookie File'}
            className="min-h-[180px] lg:min-h-[420px] w-full px-2 py-2 bg-transparent backdrop-blur-sm border border-white/10 rounded-[6px] text-white text-[13px] lg:text-[15px] placeholder-[#555] focus:outline-none focus:border-[#ed2236] mb-2 font-mono resize-none"
          />

          <button
            onClick={handleUploadCookies}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-[#ed2236]/50 hover:bg-[#d61c2e]/50 disabled:bg-[#444]/50 text-white text-[13px] lg:text-[15px] font-semibold rounded-[6px] transition-colors lowercase"
          >
            {loading ? (
              <>
                <Loader2 size={11} className="animate-spin" />
                uploading...
              </>
            ) : (
              <>
                <Upload size={11} />
                upload cookies
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    <style>{`
      * {
        line-height: 1.1;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 2px;
        height: 2px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #1f1f1f;
        border-radius: 999px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #2a2a2a;
      }

      @media (max-width: 768px) {
        body {
          overflow-y: auto;
        }
      }
    `}</style>
  </div>
);
}
