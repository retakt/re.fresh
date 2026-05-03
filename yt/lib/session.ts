import type { DownloadItem } from '../components/DownloadManager';

const SESSION_ID_KEY = 'yt-session-id';
const DOWNLOADS_KEY = 'yt-downloads';

/**
 * Get or create session ID
 * Session ID is unique per browser tab/window
 * Persists across page refreshes but not tab closes
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Save downloads to session storage
 * Only persists for current tab/window
 */
export function saveDownloads(downloads: DownloadItem[]): void {
  try {
    sessionStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
  } catch (error) {
    console.error('Failed to save downloads:', error);
  }
}

/**
 * Load downloads from session storage
 * Returns empty array if no downloads found
 */
export function loadDownloads(): DownloadItem[] {
  try {
    const data = sessionStorage.getItem(DOWNLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load downloads:', error);
    return [];
  }
}

/**
 * Clear all downloads from session storage
 */
export function clearDownloads(): void {
  try {
    sessionStorage.removeItem(DOWNLOADS_KEY);
  } catch (error) {
    console.error('Failed to clear downloads:', error);
  }
}

/**
 * Check if session storage is available
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
