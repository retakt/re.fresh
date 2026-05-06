import { FaYoutube } from "react-icons/fa";
import type { ToolConfig } from "../types";

export const ytDownloaderConfig: ToolConfig = {
  id: "yt-download",
  label: "YT Download",
  icon: FaYoutube,
  gradient: "from-red-400/20 to-red-300/10",
  iconBg: "bg-red-100/80 dark:bg-red-900/20",
  iconColor: "text-red-400 dark:text-red-300",
  border: "border-2 border-red-600/80 dark:border-red-600/80",
  shadow: "shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4),0_0_50px_rgba(220,38,38,0.2)]",
  enabled: true,
  href: "https://yt.retakt.cc",
};
