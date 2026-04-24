import { FaYoutube } from "react-icons/fa";
import type { ToolConfig } from "../types";

export const ytDownloaderConfig: ToolConfig = {
  id: "yt-download",
  label: "YT Download",
  icon: FaYoutube,
  gradient: "from-red-400/20 to-red-300/10",
  iconBg: "bg-red-100/80 dark:bg-red-900/20",
  iconColor: "text-red-400 dark:text-red-300",
  border: "border-red-200/50 dark:border-red-800/20",
  enabled: true,
  href: "https://yt.retakt.cc",
};
