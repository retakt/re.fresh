import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";

export type ToolConfig = {
  id: string;
  label: string;
  icon: LucideIcon | IconType;
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
  enabled: boolean;
  href?: string;
};
