import { useAuth } from "@/contexts/AuthContext";
import { useAccessRequests } from "@/contexts/AccessRequestContext";

export type Permission =
  | "view_dashboard"
  | "view_subsidiaries"
  | "manage_subsidiaries"
  | "upload_reports"
  | "view_analytics"
  | "view_insights"
  | "view_capital"
  | "manage_capital"
  | "view_scenarios"
  | "manage_scenarios"
  | "view_alerts"
  | "manage_alert_rules"
  | "view_export"
  | "export_reports"
  | "view_audit"
  | "view_settings"
  | "manage_team"
  | "manage_company"
  | "grant_access";

const rolePermissions: Record<string, Permission[]> = {
  // HoldCo AI parent / platform owner — sees ALL holding companies on the platform
  superadmin: [
    "view_dashboard", "view_subsidiaries", "view_analytics", "view_insights",
    "view_capital", "view_scenarios", "view_alerts", "view_export",
    "view_audit", "view_settings",
  ],
  // IT Admin — workspace setup & user provisioning. Invites MD/CEO and Analysts.
  // Has technical/support permissions but NOT business decision permissions
  // (capital reallocation, scenario approval, alert rules).
  admin: [
    "view_dashboard", "view_subsidiaries", "manage_subsidiaries",
    "upload_reports", "view_analytics", "view_insights",
    "view_capital", "view_scenarios",
    "view_alerts",
    "view_export", "export_reports",
    "view_audit", "view_settings", "manage_team", "manage_company",
    "grant_access",
  ],
  // Analyst — uploads & reporting; capital/scenarios visible but require approval
  analyst: [
    "view_dashboard", "view_subsidiaries",
    "upload_reports", "view_analytics", "view_insights",
    "view_capital", "view_scenarios",
    "view_alerts", "view_export", "export_reports",
    "view_audit", "view_settings",
  ],
  // MD / CEO — primary business user; full business rights
  viewer: [
    "view_dashboard",
    "view_subsidiaries", "manage_subsidiaries",
    "upload_reports",
    "view_analytics", "view_insights",
    "view_capital", "manage_capital",
    "view_scenarios", "manage_scenarios",
    "view_alerts", "manage_alert_rules",
    "view_export", "export_reports",
    "view_audit", "view_settings",
    "manage_company",
    "grant_access",
  ],
};

export function usePermissions() {
  const { user } = useAuth();
  const { grantsFor } = useAccessRequests();
  const role = user?.role || "viewer";
  const base = rolePermissions[role] || [];
  const granted = user ? (grantsFor(user.email) as Permission[]) : [];
  const permissions = Array.from(new Set([...base, ...granted]));

  const hasPermission = (p: Permission) => permissions.includes(p);
  const hasAny = (...ps: Permission[]) => ps.some((p) => permissions.includes(p));

  return {
    role,
    permissions,
    hasPermission,
    hasAny,
    isAdmin: role === "admin",
    isSuperAdmin: role === "superadmin",
    isCEO: role === "viewer",
  };
}
