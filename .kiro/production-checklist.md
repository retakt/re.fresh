# Production Readiness Checklist

## Current Issues & Solutions

### 1. Icons Not Loading
**Problem:** React icons (lucide-react, react-icons) sometimes fail to render on slow connections or during hydration.

**Solutions:**
- ✅ Use explicit `size` and `strokeWidth` props (already done)
- ⚠️ Add icon preloading in index.html
- ⚠️ Consider inlining critical icons as SVG sprites
- ⚠️ Add fallback text when icons fail: `{icon || "☰"}`

### 2. Content Flash / Stutter
**Problem:** Content appears in stages causing visual jumps (FOUC - Flash of Unstyled Content)

**Solutions:**
- ✅ Removed staggered entry animations (done)
- ⚠️ Add skeleton loaders that match final layout exactly
- ⚠️ Use `content-visibility: auto` for off-screen content
- ⚠️ Preload fonts in `<head>` with `<link rel="preload">`
- ⚠️ Add `font-display: swap` or `optional` to @font-face rules

### 3. Caching Strategy
**Problem:** Assets re-download on every visit, icons/fonts load slowly

**Solutions:**
```typescript
// vite.config.ts - add build optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Better caching with content hashes
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  }
})
```

**Add to index.html:**
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/plus-jakarta-sans-latin-400.woff2" as="font" type="font/woff2" crossorigin>

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://your-supabase-url.supabase.co">
```

**Service Worker (optional but recommended):**
```bash
npm install vite-plugin-pwa -D
```

### 4. Image Optimization
**Problem:** Avatar images load slowly, no fallback during load

**Solutions:**
- Use `loading="lazy"` on images
- Add blur placeholder while loading
- Compress avatars on upload (max 200x200px, WebP format)
- Use Supabase image transformations: `?width=200&quality=80`

### 5. Performance Optimizations

#### Code Splitting
```typescript
// Lazy load heavy pages
const AdminPage = lazy(() => import('./pages/admin/page'));
const PostEditor = lazy(() => import('./pages/admin/post-editor'));

// Wrap in Suspense
<Suspense fallback={<PageSkeleton />}>
  <AdminPage />
</Suspense>
```

#### Bundle Analysis
```bash
npm install rollup-plugin-visualizer -D
```

Add to vite.config.ts:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true, gzipSize: true })
]
```

### 6. Loading States

**Current:** Skeleton boxes that don't match final layout
**Better:** Exact-match skeletons

```tsx
// Create a ContentCardSkeleton component
function ContentCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 animate-pulse">
      <div className="w-6 h-6 rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
```

### 7. Error Boundaries

**Add to catch React errors gracefully:**
```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 8. Accessibility (a11y)

- ✅ Semantic HTML (already good)
- ⚠️ Add `aria-label` to icon-only buttons
- ⚠️ Test keyboard navigation (Tab, Enter, Escape)
- ⚠️ Add focus-visible styles
- ⚠️ Test with screen reader (NVDA/VoiceOver)

### 9. Mobile-Specific

**Viewport Meta (already in index.html):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

**Touch Targets:**
- ✅ Minimum 44x44px (already done for nav)
- ⚠️ Add `-webkit-tap-highlight-color: transparent` to remove blue flash on tap

**iOS Safe Areas:**
- ✅ Using `env(safe-area-inset-bottom)` (done)
- ⚠️ Test on iPhone with notch

### 10. SEO & Meta Tags

**Add to each page:**
```tsx
// Use react-helmet-async or similar
<Helmet>
  <title>Page Title | re.Takt</title>
  <meta name="description" content="..." />
  <meta property="og:title" content="..." />
  <meta property="og:image" content="..." />
</Helmet>
```

### 11. Analytics & Monitoring

**Add error tracking:**
```bash
npm install @sentry/react
```

**Add analytics:**
- Google Analytics 4
- Plausible (privacy-friendly)
- PostHog (open source)

### 12. Environment Variables

**Create `.env.production`:**
```env
VITE_SUPABASE_URL=your-prod-url
VITE_SUPABASE_ANON_KEY=your-prod-key
VITE_APP_URL=https://retakt.cc
```

**Never commit `.env` files!**

---

## Quick Wins (Do These First)

1. **Remove empty placeholder slots** ✅ (done)
2. **Fix dropdown width on mobile** ✅ (done)
3. **Preload fonts** ⚠️ (add to index.html)
4. **Add exact-match skeletons** ⚠️
5. **Lazy load admin pages** ⚠️
6. **Add error boundary** ⚠️
7. **Test on real device** ⚠️

---

## Testing Checklist

- [ ] Test on iPhone Safari (notch handling)
- [ ] Test on Android Chrome (safe areas)
- [ ] Test on slow 3G connection (throttle in DevTools)
- [ ] Test with JavaScript disabled (graceful degradation)
- [ ] Test with ad blockers enabled
- [ ] Run Lighthouse audit (aim for 90+ on all metrics)
- [ ] Test keyboard navigation
- [ ] Test with screen reader

---

## Deployment

**Build for production:**
```bash
npm run build
npm run preview  # Test production build locally
```

**Optimize before deploy:**
1. Run `npm run build` and check bundle sizes
2. Compress images (use tinypng.com or similar)
3. Enable gzip/brotli on server
4. Set cache headers (1 year for hashed assets, no-cache for index.html)
5. Add CSP headers for security

**Hosting recommendations:**
- Vercel (zero config, automatic)
- Netlify (similar to Vercel)
- Cloudflare Pages (fastest CDN)
- Your own server with nginx/caddy
