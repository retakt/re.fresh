import { Bot, MessageSquare, Layers, Shuffle, Sparkles } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { bgRemoverConfig } from "./bg-remover/config";
import { ytDownloaderConfig } from "./yt-downloader/config";
import type { ToolConfig } from "./types";

// Import all tool configs
const toolConfigs: ToolConfig[] = [
  bgRemoverConfig,
  ytDownloaderConfig,
  {
    id: "ig-saver",
    label: "IG Saver",
    icon: FaInstagram,
    gradient: "from-[#FF2E9B]/20 to-[#FF2E9B]/10", // Hot Magenta
    iconBg: "bg-[#FF2E9B]/10 dark:bg-[#FF2E9B]/15",
    iconColor: "text-[#FF2E9B]",
    border: "border-[#FF2E9B]/40",
    enabled: false,
  },
  {
    id: "hugging-face",
    label: "Hugging Face",
    icon: Bot,
    gradient: "from-[#FFFF00]/20 to-[#FFFF00]/10", // Yellow
    iconBg: "bg-[#FFFF00]/10 dark:bg-[#FFFF00]/15",
    iconColor: "text-[#FFFF00]",
    border: "border-[#FFFF00]/40",
    enabled: false,
  },
  {
    id: "reddit",
    label: "Reddit",
    icon: MessageSquare,
    gradient: "from-[#00FFFF]/20 to-[#00FFFF]/10", // Aqua
    iconBg: "bg-[#00FFFF]/10 dark:bg-[#00FFFF]/15",
    iconColor: "text-[#00FFFF]",
    border: "border-[#00FFFF]/40",
    enabled: false,
  },
  {
    id: "sampletter",
    label: "Sampletter",
    icon: Layers,
    gradient: "from-[#7E36E3]/20 to-[#7E36E3]/10", // Electric Purple
    iconBg: "bg-[#7E36E3]/10 dark:bg-[#7E36E3]/15",
    iconColor: "text-[#7E36E3]",
    border: "border-[#7E36E3]/40",
    enabled: false,
  },
  {
    id: "face-swap",
    label: "Face Swap",
    icon: Shuffle,
    gradient: "from-[#FF00FF]/20 to-[#FF00FF]/10", // Fuchsia
    iconBg: "bg-[#FF00FF]/10 dark:bg-[#FF00FF]/15",
    iconColor: "text-[#FF00FF]",
    border: "border-[#FF00FF]/40",
    enabled: false,
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    icon: Sparkles,
    gradient: "from-[#39FF14]/20 to-[#39FF14]/10", // Neon Green
    iconBg: "bg-[#39FF14]/10 dark:bg-[#39FF14]/15",
    iconColor: "text-[#39FF14]",
    border: "border-[#39FF14]/40",
    enabled: false,
  },
];

// Export only enabled tools for production
export const TOOLS = toolConfigs;

// Export all for admin/dev purposes
export const ALL_TOOLS = toolConfigs;

export type { ToolConfig };
