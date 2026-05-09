import { Scissors } from "lucide-react";
import type { ToolConfig } from "../types";

export const bgRemoverConfig: ToolConfig = {
  id: "bg-remover",
  label: "BG Remover",
  icon: Scissors,
  gradient: "from-[#00FFFF]/20 to-[#00FFFF]/10", // Aqua/Cyan
  iconBg: "bg-[#00FFFF]/10 dark:bg-[#00FFFF]/15",
  iconColor: "text-[#00FFFF]",
  border: "border-[#00FFFF]/40",
  enabled: false, // Set to true when ready
  href: "/tools/bg-remover", // Future route
};
