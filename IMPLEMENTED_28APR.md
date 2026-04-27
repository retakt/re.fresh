# Implementation Log - April 28, 2026

## Version: beta v1.4.5

### Features & Fixes Implemented

#### 1. Animated Code Blocks Integration
- Integrated `@animate-ui/components-animate-code` package
- Created custom TipTap extension `AnimatedCodeBlock` for rich text editor
- Added code insertion dialog with 19 programming languages (including C and C++)
- Implemented typing animation with cursor effect
- Set cream/coffee background color (#D7B397) for code blocks
- Added dark header (#2a2a2a) with language label and copy button
- Enabled scrolling for long code blocks (max-height: 500px)
- Fixed cursor color to black for visibility on cream background
- Removed extra spacing below code content

**Files Modified:**
- `src/components/rich-text-editor-code-block.tsx` - TipTap extension
- `src/components/rich-text-editor.tsx` - Added code block button to toolbar
- `src/components/post-content-renderer.tsx` - Renders animated code on blog pages
- `src/components/animate-ui/components/animate/code.tsx` - Styling and cursor fixes
- `src/pages/blog/post.tsx` - Integrated PostContentRenderer

#### 2. Database Migration
- Added `cover_image_opacity` column to posts table
- Default value: 1 (fully opaque)
- Fixed Supabase 400 error when saving posts

**Files Created:**
- `supabase/migrations/20260428_add_cover_image_opacity.sql`

#### 3. Paragraph Comments Disabled
- Removed "Reply" button from individual paragraphs
- Removed "Comment on..." button from paragraph hover
- Removed hover effects and borders on paragraphs
- Kept main comment section at bottom of posts

**Files Modified:**
- `src/pages/blog/post.tsx`

#### 4. Rich Text Editor Enhancements
- Fixed bullet points not displaying on published blog pages (removed `not-prose` class)
- Maintained all existing features: glow intensity, color picker, font size control

### Technical Details

**Code Block Animation:**
- Uses `writing={true}` and `cursor={true}` props
- Typing animation plays when code block is rendered
- Cursor animates during typing effect
- Background: #D7B397 (cream/coffee) - **Static color for both light/dark modes**
- Border: #c9a582 (darker cream)
- Header: #2a2a2a (dark gray)
- Cursor: black

**Why Static Background Color?**
The code blocks use a fixed cream/coffee background (#D7B397) instead of theme-dependent colors because:
1. **DOM Rendering Issue**: The animate-ui component was rendering differently in dark mode vs light mode
2. In light mode, the code blocks displayed perfectly with proper syntax highlighting
3. In dark mode, the background color was being overridden or rendered incorrectly by the theme system
4. The issue stems from how the HTML/CSS theme classes interact with the dynamically rendered React components
5. Using a static background color bypasses the theme-dependent rendering issues

**Root Cause:**
- The `PostContentRenderer` component uses `createRoot` to dynamically render React components into HTML
- Theme classes (light/dark) from the parent HTML don't properly cascade to these dynamically created React roots
- The `useTheme()` hook in the Code component may not sync correctly with the parent theme context
- CSS specificity conflicts between global theme styles and component-level styles

**Future Fix (To Tackle from Root):**
1. **Pass theme context explicitly** to dynamically rendered components in `PostContentRenderer`
2. **Wrap dynamic React roots** with ThemeProvider to ensure theme context is available
3. **Use CSS variables** instead of hardcoded colors that can inherit from parent theme
4. **Refactor PostContentRenderer** to avoid `createRoot` and use proper React component rendering
5. **Test theme synchronization** between editor view and published blog view
6. **Update animate-ui integration** to respect parent theme without DOM conflicts

**Temporary Solution:**
Static cream background provides consistent, readable code blocks across all themes until the root DOM rendering issue is resolved.

**Supported Languages:**
JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, HTML, CSS, SQL, Bash, JSON, YAML

### Known Issues
None

### Next Steps
- Monitor code block animation performance
- Consider adding more language support if needed
- Test across different browsers and devices
