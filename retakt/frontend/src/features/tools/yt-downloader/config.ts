import { FaYoutube } from "react-icons/fa";
import type { ToolConfig } from "../types";

export const ytDownloaderConfig: ToolConfig = {
  id: "yt-download",
  label: "YT Download",
  icon: FaYoutube,
  gradient: "from-red-500/20 to-red-400/10",
  iconBg: "bg-red-100/80 dark:bg-red-900/20",
  iconColor: "text-red-500 dark:text-red-400",
  border: "border-2 border-red-500/80",
  shadow: "shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4),0_0_50px_rgba(239,68,68,0.2)]",
  enabled: true,
  href: "https://yt.retakt.cc",
};
