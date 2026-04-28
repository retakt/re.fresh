# Cover Image Implementation - Glass Overlay Effect

**Date**: April 28, 2026  
**Status**: ✅ Implemented

---

## Overview
Moved cover images from separate sections below the header into the header card itself as background images, with a semi-transparent gradient overlay creating a glass-like effect.

---

## Key Changes

### 1. **Image Positioning**
- **Before**: Cover image was a separate section below the header card
- **After**: Cover image is positioned absolutely inside the header card as a background layer

### 2. **Glass Overlay Effect**
- Applied existing palette gradient with `backdrop-blur-[2px]` on top of the image
- Gradient uses `headerGradient` from `getCardPalette()` system
- Creates semi-transparent effect where both image and card color are visible
- Text remains readable on various image backgrounds

### 3. **Loading State**
- Added `imageLoaded` state to track image loading
- Shows real content (title, excerpt, tags, metadata) immediately during loading
- Only background shows skeleton shimmer (`animate-pulse bg-muted/50`)
- Smooth fade-in transition (`duration-500`) when image loads
- No separate skeleton component needed - handled inline

### 4. **Image Opacity**
- Respects `cover_image_opacity` field from database
- Respects `cover_image_position` field for object positioning
- Smooth transition from 0 to target opacity on load

---

## Implementation Details

### Structure
```tsx
<div className="relative ...">
  {/* Background image layer */}
  <img className="absolute inset-0 ..." />
  {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-muted/50" />}
  
  {/* Glass overlay */}
  <div className="absolute inset-0 bg-gradient-to-b {palette.headerGradient} backdrop-blur-[2px]" />
  
  {/* Content on top */}
  <div className="relative z-10">
    {/* Title, excerpt, tags, etc. */}
  </div>
</div>
```

### Layer Stack (bottom to top)
1. Background image (absolute, inset-0)
2. Loading shimmer (absolute, inset-0, only visible when loading)
3. Gradient overlay with backdrop-blur (absolute, inset-0)
4. Content (relative, z-10)

---

## Files Modified

### `src/pages/blog/post.tsx`
- Added `imageLoaded` state
- Moved cover image inside header card
- Added gradient overlay with `backdrop-blur-[2px]`
- Implemented loading state with shimmer background
- Removed separate cover image section

### `src/pages/tutorials/post.tsx`
- Same changes as blog post page
- Consistent implementation across both content types

---

## Design Decisions

### Why handle loading inline?
- Simpler implementation
- Content is immediately visible (better UX)
- Only background needs loading state
- Avoids creating unnecessary components

### Why backdrop-blur-[2px]?
- Creates subtle glass effect
- Maintains text readability
- Doesn't over-blur the image
- Can be adjusted if needed

### Why show content during loading?
- Better perceived performance
- Users see meaningful content immediately
- Only background image needs to load
- Reduces layout shift

---

## Testing Checklist
- [ ] Glass overlay looks good with various images
- [ ] Text remains readable on different image backgrounds
- [ ] Loading state works correctly (shimmer → fade-in)
- [ ] Smooth transition when image loads
- [ ] Works on mobile devices
- [ ] Works on desktop
- [ ] Respects cover_image_opacity setting
- [ ] Respects cover_image_position setting
- [ ] Works in both light and dark themes

---

## Potential Adjustments

If text readability is poor:
- Increase backdrop-blur (e.g., `backdrop-blur-[4px]`)
- Increase gradient opacity in `cardColors.ts` headerGradient values
- Add text shadow to content

If glass effect is too strong:
- Reduce backdrop-blur (e.g., `backdrop-blur-[1px]`)
- Reduce gradient opacity in headerGradient values

---

## Related Files
- `src/lib/cardColors.ts` - Palette gradient system
- `src/components/ui/skeleton.tsx` - PostDetailSkeleton (used for full page loading)
