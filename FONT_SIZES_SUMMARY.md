# Font Sizes Used in re.Takt

## Content Pages (Blog, Tutorials, Music Details)
**Line Height:** `1.3` (all devices)

### Desktop
- **Body text:** `prose-sm` (Tailwind default ~14px)
- **Line height:** `1.3`

### Mobile  
- **Body text:** `12px`
- **Line height:** `1.3`

---

## UI Components - Common Sizes

### Extra Small (9-10px)
- `text-[9px]` - Smallest labels, badges, timestamps
- `text-[10px]` - Small metadata, tags, buttons

### Small (11-12px)
- `text-[11px]` - Secondary text, descriptions
- `text-[12px]` - Mobile body text, small content
- `text-xs` (12px) - Tailwind small text

### Base (13-14px)
- `text-[13px]` - Code blocks, list items
- `text-sm` (14px) - Standard UI text, buttons
- `text-base` (16px) - Default body text

### Medium (15-16px)
- `text-[15px]` - H2 headings in content
- `text-base` (16px) - H1 headings in content

### Large (18px+)
- `text-lg` (18px) - Page titles (mobile)
- `text-xl` (20px) - Page titles (desktop)
- `text-2xl` (24px) - Large headings
- `text-3xl` (30px) - Hero text
- `text-4xl` (36px) - Extra large headings

---

## Specific Use Cases

### Music Page
- **Desktop description:** `prose-sm` with `lineHeight: 1.3`
- **Mobile description:** `12px` with `lineHeight: 1.3`
- **Album mobile notes:** `11px` with `lineHeight: 1.3`

### Blog/Tutorial Posts
- **Desktop:** `prose-sm` with `lineHeight: 1.3`
- **Mobile:** `12px` with `lineHeight: 1.3`

### Code Blocks
- **Code text:** `13px`
- **Code inline:** `12px`

### Badges & Tags
- **Small tags:** `9px`
- **Regular tags:** `10px`
- **Medium tags:** `text-xs` (12px)

### Buttons
- **Small buttons:** `10px`
- **Regular buttons:** `text-sm` (14px)

### Metadata
- **Timestamps:** `9-10px`
- **Author/date info:** `11-13px`
- **Secondary info:** `text-xs` (12px)

---

## Global Typography Settings

### Font Families
```css
--font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif
--font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas
```

### Font Weights
- **Regular:** 400-450
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### Line Heights
- **Tight:** `leading-tight` (1.25)
- **Content:** `1.3` (custom for all detail pages)
- **Normal:** `leading-normal` (1.5)
- **Relaxed:** `leading-relaxed` (1.625)

---

## Recommendations

1. **Content readability:** Keep at `12px` mobile / `prose-sm` desktop with `1.3` line-height
2. **UI elements:** Use `text-xs` (12px) to `text-sm` (14px) for most buttons/labels
3. **Metadata:** Use `9-11px` for timestamps, tags, small labels
4. **Headings:** Scale from `text-base` (16px) to `text-xl` (20px) for content pages
5. **Consistency:** Stick to Tailwind's default scale when possible for maintainability
