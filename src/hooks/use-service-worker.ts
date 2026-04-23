import { useEffect, useState } from 'react';

export type SwStatus = 'idle' | 'registered' | 'update-available' | 'offline' | 'error';

export function useServiceWorker() {
  const [status, setStatus] = useState<SwStatus>('idle');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        setRegistration(reg);
        setStatus('registered');

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setStatus('update-available');
            }
          });
        });
      } catch (err) {
        console.warn('Service worker registration failed:', err);
        setStatus('error');
      }
    };

    // Register after page load to not block critical resources
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', () => void register(), { once: true });
    }

    // Track online/offline
    const handleOffline = () => setStatus('offline');
    const handleOnline = () => setStatus(registration ? 'registered' : 'idle');

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const update = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return { status, update };
}
