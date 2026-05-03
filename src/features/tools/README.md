# Tools System

Modular tool configuration system for easy addition/removal of tools on the homepage.

## Structure

```
src/features/tools/
├── types.ts              # Shared TypeScript types
├── index.ts              # Central registry (import/export all tools)
├── bg-remover/
│   ├── config.ts         # Tool metadata & styling
│   └── page.tsx          # Tool implementation (future)
├── yt-download/
│   └── config.ts
└── ... (more tools)
```

## Adding a New Tool

1. **Create a folder** for your tool:
   ```bash
   mkdir src/features/tools/my-tool
   ```

2. **Create `config.ts`**:
   ```typescript
   import { MyIcon } from "lucide-react";
   import type { ToolConfig } from "../types";

   export const myToolConfig: ToolConfig = {
     id: "my-tool",
     label: "My Tool",
     icon: MyIcon,
     gradient: "from-blue-400/20 to-blue-300/10",
     iconBg: "bg-blue-100/80 dark:bg-blue-900/20",
     iconColor: "text-blue-400 dark:text-blue-300",
     border: "border-blue-200/50 dark:border-blue-800/20",
     enabled: true,
     href: "/tools/my-tool", // Optional: link to tool page
   };
   ```

3. **Register in `index.ts`**:
   ```typescript
   import { myToolConfig } from "./my-tool/config";

   const toolConfigs: ToolConfig[] = [
     // ... existing tools
     myToolConfig,
   ];
   ```

4. **Done!** The tool will appear on the homepage automatically.

## Removing a Tool

1. **Delete the tool folder**:
   ```bash
   rm -rf src/features/tools/my-tool
   ```

2. **Remove from `index.ts`**:
   - Delete the import
   - Remove from `toolConfigs` array

## Enabling/Disabling Tools

Set `enabled: false` in the tool's `config.ts` to hide it from the homepage without deleting the code:

```typescript
export const myToolConfig: ToolConfig = {
  // ...
  enabled: false, // Hidden but code remains
};
```

## Tool Configuration Options

```typescript
type ToolConfig = {
  id: string;              // Unique identifier (kebab-case)
  label: string;           // Display name
  icon: LucideIcon | IconType; // Icon component
  gradient: string;        // Tailwind gradient classes
  iconBg: string;          // Icon background color
  iconColor: string;       // Icon color
  border: string;          // Border color
  enabled: boolean;        // Show/hide on homepage
  href?: string;           // Optional: link to tool page
};
```

## Color Palette Guide

Use these Tailwind color combinations for consistency:

| Color | Gradient | Icon BG | Icon Color | Border |
|-------|----------|---------|------------|--------|
| Rose | `from-rose-400/20 to-pink-400/10` | `bg-rose-100/80 dark:bg-rose-900/20` | `text-rose-400 dark:text-rose-300` | `border-rose-200/50 dark:border-rose-800/20` |
| Red | `from-red-400/20 to-red-300/10` | `bg-red-100/80 dark:bg-red-900/20` | `text-red-400 dark:text-red-300` | `border-red-200/50 dark:border-red-800/20` |
| Orange | `from-orange-400/20 to-amber-300/10` | `bg-orange-100/80 dark:bg-orange-900/20` | `text-orange-400 dark:text-orange-300` | `border-orange-200/50 dark:border-orange-800/20` |
| Yellow | `from-yellow-400/20 to-amber-300/10` | `bg-yellow-100/80 dark:bg-yellow-900/20` | `text-yellow-500 dark:text-yellow-300` | `border-yellow-200/50 dark:border-yellow-800/20` |
| Green | `from-green-400/20 to-emerald-300/10` | `bg-green-100/80 dark:bg-green-900/20` | `text-green-400 dark:text-green-300` | `border-green-200/50 dark:border-green-800/20` |
| Blue | `from-blue-400/20 to-indigo-300/10` | `bg-blue-100/80 dark:bg-blue-900/20` | `text-blue-400 dark:text-blue-300` | `border-blue-200/50 dark:border-blue-800/20` |
| Purple | `from-purple-400/20 to-violet-300/10` | `bg-purple-100/80 dark:bg-purple-900/20` | `text-purple-400 dark:text-purple-300` | `border-purple-200/50 dark:border-purple-800/20` |
| Pink | `from-pink-400/20 to-purple-400/10` | `bg-pink-100/80 dark:bg-pink-900/20` | `text-pink-400 dark:text-pink-300` | `border-pink-200/50 dark:border-pink-800/20` |
| Teal | `from-teal-400/20 to-cyan-300/10` | `bg-teal-100/80 dark:bg-teal-900/20` | `text-teal-400 dark:text-teal-300` | `border-teal-200/50 dark:border-teal-800/20` |

## Example: Complete Tool Setup

```typescript
// src/features/tools/image-compressor/config.ts
import { ImageDown } from "lucide-react";
import type { ToolConfig } from "../types";

export const imageCompressorConfig: ToolConfig = {
  id: "image-compressor",
  label: "Image Compressor",
  icon: ImageDown,
  gradient: "from-green-400/20 to-emerald-300/10",
  iconBg: "bg-green-100/80 dark:bg-green-900/20",
  iconColor: "text-green-400 dark:text-green-300",
  border: "border-green-200/50 dark:border-green-800/20",
  enabled: true,
  href: "/tools/image-compressor",
};
```

```typescript
// src/features/tools/index.ts
import { imageCompressorConfig } from "./image-compressor/config";

const toolConfigs: ToolConfig[] = [
  // ... existing tools
  imageCompressorConfig,
];
```

That's it! The tool now appears on the homepage.
