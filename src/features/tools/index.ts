import { Bot, MessageSquare, Layers, Shuffle, Sparkles } from "lucide-react";
import { FaYoutube, FaInstagram } from "react-icons/fa";
import { bgRemoverConfig } from "./bg-remover/config";
import type { ToolConfig } from "./types";

// Import all tool configs
const toolConfigs: ToolConfig[] = [
  bgRemoverConfig,
  {
    id: "yt-download",
    label: "YT Download",
    icon: FaYoutube,
    gradient: "from-red-400/20 to-red-300/10",
    iconBg: "bg-red-100/80 dark:bg-red-900/20",
    iconColor: "text-red-400 dark:text-red-300",
    border: "border-red-200/50 dark:border-red-800/20",
    enabled: false,
  },
  {
    id: "ig-saver",
    label: "IG Saver",
    icon: FaInstagram,
    gradient: "from-pink-400/20 to-purple-400/10",
    iconBg: "bg-pink-100/80 dark:bg-pink-900/20",
    iconColor: "text-pink-400 dark:text-pink-300",
    border: "border-pink-200/50 dark:border-pink-800/20",
    enabled: false,
  },
  {
    id: "hugging-face",
    label: "Hugging Face",
    icon: Bot,
    gradient: "from-yellow-400/20 to-amber-300/10",
    iconBg: "bg-yellow-100/80 dark:bg-yellow-900/20",
    iconColor: "text-yellow-500 dark:text-yellow-300",
    border: "border-yellow-200/50 dark:border-yellow-800/20",
    enabled: false,
  },
  {
    id: "reddit",
    label: "Reddit",
    icon: MessageSquare,
    gradient: "from-orange-400/20 to-amber-300/10",
    iconBg: "bg-orange-100/80 dark:bg-orange-900/20",
    iconColor: "text-orange-400 dark:text-orange-300",
    border: "border-orange-200/50 dark:border-orange-800/20",
    enabled: false,
  },
  {
    id: "sampletter",
    label: "Sampletter",
    icon: Layers,
    gradient: "from-blue-400/20 to-indigo-300/10",
    iconBg: "bg-blue-100/80 dark:bg-blue-900/20",
    iconColor: "text-blue-400 dark:text-blue-300",
    border: "border-blue-200/50 dark:border-blue-800/20",
    enabled: false,
  },
  {
    id: "face-swap",
    label: "Face Swap",
    icon: Shuffle,
    gradient: "from-purple-400/20 to-violet-300/10",
    iconBg: "bg-purple-100/80 dark:bg-purple-900/20",
    iconColor: "text-purple-400 dark:text-purple-300",
    border: "border-purple-200/50 dark:border-purple-800/20",
    enabled: false,
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    icon: Sparkles,
    gradient: "from-teal-400/20 to-cyan-300/10",
    iconBg: "bg-teal-100/80 dark:bg-teal-900/20",
    iconColor: "text-teal-400 dark:text-teal-300",
    border: "border-teal-200/50 dark:border-teal-800/20",
    enabled: false,
  },
];

// Export only enabled tools for production
export const TOOLS = toolConfigs;

// Export all for admin/dev purposes
export const ALL_TOOLS = toolConfigs;

export type { ToolConfig };
