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
1. The animate-ui component's syntax highlighting was designed for specific background colors
2. Theme-dependent backgrounds caused readability issues with syntax highlighting colors
3. The cream color provides good contrast for both light and dark mode text
4. Maintains consistent visual identity across theme switches

**Future Improvements:**
To make code blocks theme-aware from the root, consider:
1. Modify the animate-ui component's color scheme configuration
2. Create custom syntax highlighting themes that work with both light/dark backgrounds
3. Update the `Code` component in `src/components/animate-ui/components/animate/code.tsx` to use theme-based background colors
4. Test all 19 supported languages with new color schemes
5. Ensure cursor and text remain visible in both themes

**Supported Languages:**
JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, HTML, CSS, SQL, Bash, JSON, YAML

### Known Issues
None

### Next Steps
- Monitor code block animation performance
- Consider adding more language support if needed
- Test across different browsers and devices
