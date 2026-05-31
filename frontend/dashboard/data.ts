import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  Focus,
  LayoutDashboard,
  Link2,
  Target,
  Users,
  Vault,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
};

export const SIDEBAR_NAV: NavItem[] = [
  { id: "mission", label: "Mission Control", icon: LayoutDashboard },
  { id: "focus", label: "Deep Focus", icon: Focus },
  { id: "mock", label: "Mock Center", icon: Target },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "mentor", label: "AI Mentor", icon: Brain },
  { id: "parent", label: "Parent Connect", icon: Users },
  { id: "vault", label: "Vault", icon: Vault },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "alerts", label: "Alerts", icon: AlertCircle },
];
