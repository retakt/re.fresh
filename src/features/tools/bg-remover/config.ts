import { Scissors } from "lucide-react";
import type { ToolConfig } from "../types";

export const bgRemoverConfig: ToolConfig = {
  id: "bg-remover",
  label: "BG Remover",
  icon: Scissors,
  gradient: "from-rose-400/20 to-pink-400/10",
  iconBg: "bg-rose-100/80 dark:bg-rose-900/20",
  iconColor: "text-rose-400 dark:text-rose-300",
  border: "border-rose-600/60 dark:border-rose-600/60",
  shadow: "shadow-[0_0_10px_rgba(225,29,72,0.2)] hover:shadow-[0_0_20px_rgba(225,29,72,0.3),0_0_40px_rgba(225,29,72,0.15)]",
  enabled: false, // Set to true when ready
  href: "/tools/bg-remover", // Future route
};
