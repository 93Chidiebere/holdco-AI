import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, Permission } from "@/hooks/usePermissions";
import { useAccessRequests, AccessModule } from "@/contexts/AccessRequestContext";
import { Lock, Send, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Building2,
  Upload,
  BarChart3,
  Brain,
  Wallet,
  FlaskConical,
  Bell,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { useState } from "react";

const navItems: { to: string; icon: typeof LayoutDashboard; label: string; permission: Permission }[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", permission: "view_dashboard" },
  { to: "/subsidiaries", icon: Building2, label: "Subsidiaries", permission: "view_subsidiaries" },
  { to: "/upload", icon: Upload, label: "Upload Reports", permission: "upload_reports" },
  { to: "/analytics", icon: BarChart3, label: "KPI Analytics", permission: "view_analytics" },
  { to: "/insights", icon: Brain, label: "AI Insights", permission: "view_insights" },
  { to: "/capital", icon: Wallet, label: "Capital Allocation", permission: "view_capital" },
  { to: "/scenarios", icon: FlaskConical, label: "Scenario Modeling", permission: "view_scenarios" },
  { to: "/alerts", icon: Bell, label: "Alerts", permission: "view_alerts" },
  { to: "/export", icon: FileText, label: "Board Export", permission: "view_export" },
  { to: "/audit", icon: ClipboardList, label: "Audit Trail", permission: "view_audit" },
  { to: "/settings", icon: Settings, label: "Settings", permission: "view_settings" },
];

const platformNavItems = [
  { to: "/platform", icon: Globe, label: "Platform Overview" },
];

export default function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission, role } = usePermissions();
  const { hasGrant, pendingFor, submitRequest } = useAccessRequests();
  const [collapsed, setCollapsed] = useState(false);
  const [requestModule, setRequestModule] = useState<{ module: AccessModule; label: string } | null>(null);
  const [reason, setReason] = useState("");

  const lockedFor = (to: string): AccessModule | null => {
    if (role !== "analyst" || !user) return null;
    if (to === "/capital" && !hasGrant(user.email, "manage_capital")) return "manage_capital";
    if (to === "/scenarios" && !hasGrant(user.email, "manage_scenarios")) return "manage_scenarios";
    return null;
  };

  const isPlatformOwner = role === "superadmin";
  const visibleItems = isPlatformOwner ? [] : navItems.filter((item) => hasPermission(item.permission));

  const handleSubmitRequest = () => {
    if (!user || !requestModule) return;
    submitRequest(user.email, user.name, requestModule.module, reason || "(no reason provided)");
    toast.success("Access request submitted", {
      description: `Your MD/CEO or Admin will review your request for ${requestModule.label}.`,
    });
    setReason("");
    setRequestModule(null);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col border-r border-sidebar-border z-50 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">H</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-sidebar-accent-foreground font-semibold text-sm tracking-tight whitespace-nowrap block truncate">
                {user?.holding_company_name || "HoldCo AI"}
              </span>
              <span className="text-sidebar-foreground text-xs truncate block">HoldCo AI</span>
            </div>
          )}
        </div>
        {!collapsed && user && (() => {
          const roleLabel = user.role === "viewer" ? "MD/CEO" : user.role === "superadmin" ? "Platform" : user.role;
          const roleClass =
            user.role === "viewer" ? "bg-success/15 text-success" :
            user.role === "superadmin" ? "bg-primary/15 text-primary" :
            user.role === "admin" ? "bg-info/15 text-info" :
            "bg-muted text-muted-foreground";
          return (
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0", roleClass)}>
              {roleLabel}
            </span>
          );
        })()}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {isPlatformOwner && platformNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.to;
          const locked = lockedFor(item.to);
          const pending = locked && user ? pendingFor(user.email, locked) : undefined;
          return (
            <div key={item.to} className="space-y-1">
              <Link
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between gap-2 whitespace-nowrap">
                    <span>{item.label}</span>
                    {locked && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </span>
                )}
              </Link>
              {locked && !collapsed && (
                pending ? (
                  <div className="ml-10 mr-1 flex items-center gap-1.5 text-[11px] text-muted-foreground px-2 py-1 rounded-md bg-muted/40">
                    <Clock className="w-3 h-3 text-warning" />
                    <span>Request pending review</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRequestModule({ module: locked, label: item.label });
                    }}
                    className="ml-10 mr-1 flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 hover:bg-primary/10 px-2 py-1 rounded-md transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Request access</span>
                  </button>
                )
              )}
            </div>
          );
        })}
      </nav>

      <Dialog open={!!requestModule} onOpenChange={(o) => { if (!o) { setRequestModule(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request access to {requestModule?.label}</DialogTitle>
            <DialogDescription>
              Your MD/CEO or Admin will review this request. You'll get access as soon as it's approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sidebar-reason">Reason for access (optional)</Label>
            <Textarea
              id="sidebar-reason"
              placeholder="E.g. I need to model Q3 reallocation across FinServe and EnergyPrime…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRequestModule(null); setReason(""); }}>Cancel</Button>
            <Button onClick={handleSubmitRequest} className="gap-2">
              <Send className="w-4 h-4" /> Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground truncate capitalize">
                {user.role === "viewer" ? "MD / CEO" : user.role === "superadmin" ? "HoldCo AI Platform" : user.role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
