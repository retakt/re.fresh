import { Scissors } from "lucide-react";
import type { ToolConfig } from "../types";

export const bgRemoverConfig: ToolConfig = {
  id: "bg-remover",
  label: "BG Remover",
  icon: Scissors,
  gradient: "from-rose-400/20 to-pink-400/10",
  iconBg: "bg-rose-100/80 dark:bg-rose-900/20",
  iconColor: "text-rose-400 dark:text-rose-300",
  border: "border-rose-600/30",
  enabled: false, // Set to true when ready
  href: "/tools/bg-remover", // Future route
};
