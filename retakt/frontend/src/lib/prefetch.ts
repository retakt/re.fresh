/**
 * Prefetch a route's JS chunk when the user hovers over a link.
 * Works with Vite's dynamic import() — the browser will cache the chunk
 * so navigation feels instant.
 */

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  prefetched.add(path);

  // Map route paths to their lazy-loaded modules
  const routeMap: Record<string, () => Promise<unknown>> = {
    '/': () => import('../pages/Index.tsx'),
    '/blog': () => import('../pages/blog/page.tsx'),
    '/tutorials': () => import('../pages/tutorials/page.tsx'),
    '/music': () => import('../pages/music/page.tsx'),
    '/files': () => import('../pages/files/page.tsx'),
    '/about': () => import('../pages/about/page.tsx'),
    '/search': () => import('../pages/search/page.tsx'),
    '/chat': () => import('../pages/chat/page.tsx'),
    '/whats-new': () => import('../pages/whats-new/page.tsx'),
    '/admin': () => import('../pages/admin/page.tsx'),
    '/editor': () => import('../pages/editor/page.tsx'),
    '/admin/posts': () => import('../pages/admin/posts.tsx'),
    '/admin/tutorials': () => import('../pages/admin/tutorials.tsx'),
    '/admin/music': () => import('../pages/admin/music.tsx'),
    '/admin/files': () => import('../pages/admin/files.tsx'),
  };

  const loader = routeMap[path];
  if (loader) {
    // Use requestIdleCallback to not block main thread
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loader().catch(() => {}), { timeout: 2000 });
    } else {
      setTimeout(() => loader().catch(() => {}), 200);
    }
  }
}

/**
 * Prefetch Supabase data for a specific post/tutorial slug.
 * Stores result in sessionStorage so the page load is instant.
 */
export function prefetchPostData(table: 'posts' | 'tutorials', slug: string) {
  const key = `prefetch:${table}:${slug}`;
  if (sessionStorage.getItem(key)) return;

  void import('../lib/supabase').then(({ supabase }) => {
    void supabase
      .from(table)
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          sessionStorage.setItem(key, JSON.stringify(data));
        }
      });
  });
}

export function getPrefetchedData<T>(table: 'posts' | 'tutorials', slug: string): T | null {
  const key = `prefetch:${table}:${slug}`;
  const stored = sessionStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}
