import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Check, AlertTriangle, Info, ShieldAlert, TrendingDown } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface Notification {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  subsidiary: string;
  timestamp: string;
  read: boolean;
}

interface AlertRule {
  id: string;
  metric: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

const initialNotifications: Notification[] = [
  { id: "1", type: "critical", title: "Liquidity ratio below threshold", description: "EnergyPrime's liquidity ratio dropped to 0.8, below the critical threshold of 1.0.", subsidiary: "EnergyPrime", timestamp: "2026-03-10T09:15:00", read: false },
  { id: "2", type: "warning", title: "Operating cost spike detected", description: "EnergyPrime shows a 30% increase in operating costs vs 6-month trend.", subsidiary: "EnergyPrime", timestamp: "2026-03-09T14:30:00", read: false },
  { id: "3", type: "warning", title: "Debt-to-equity ratio rising", description: "EnergyPrime's D/E ratio has risen to 1.5, above the 1.2 warning threshold.", subsidiary: "EnergyPrime", timestamp: "2026-03-08T11:00:00", read: true },
  { id: "4", type: "info", title: "Revenue milestone reached", description: "FinServe Holdings achieved 4 consecutive months of 5%+ MoM growth.", subsidiary: "FinServe Holdings", timestamp: "2026-03-07T16:45:00", read: true },
  { id: "5", type: "info", title: "Margin improvement noted", description: "TechVentures EBITDA margin improved by 2.1% over the last quarter.", subsidiary: "TechVentures Ltd", timestamp: "2026-03-06T10:20:00", read: true },
];

const initialRules: AlertRule[] = [
  { id: "1", metric: "Liquidity Ratio", condition: "below", threshold: 1.0, enabled: true },
  { id: "2", metric: "Debt-to-Equity Ratio", condition: "above", threshold: 1.2, enabled: true },
  { id: "3", metric: "EBITDA Margin", condition: "below", threshold: 15, enabled: true },
  { id: "4", metric: "Revenue Growth (MoM)", condition: "below", threshold: -5, enabled: false },
  { id: "5", metric: "Operating Cost Change", condition: "above", threshold: 20, enabled: true },
];

const typeConfig = {
  critical: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", badge: "secondary" as const },
  info: { icon: Info, color: "text-info", bg: "bg-info/10", badge: "outline" as const },
};

export default function AlertsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [rules, setRules] = useState(initialRules);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const toggleRule = (id: string) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  const updateThreshold = (id: string, value: number) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, threshold: value } : r)));

  const { hasPermission } = usePermissions();
  const canManageRules = hasPermission("manage_alert_rules");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts & Notifications</h1>
            <p className="text-muted-foreground">Monitor thresholds and stay informed on portfolio changes</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="w-4 h-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <Tabs defaultValue="notifications">
          <TabsList>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications {unreadCount > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5">{unreadCount}</Badge>}
            </TabsTrigger>
            {canManageRules && (
              <TabsTrigger value="rules" className="gap-2">
                <AlertTriangle className="w-4 h-4" /> Alert Rules
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="notifications" className="space-y-3 mt-4">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <Card key={n.id} className={`transition-all ${!n.read ? "border-primary/30 shadow-sm" : "opacity-75"}`}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant={cfg.badge} className="text-xs capitalize">{n.type}</Badge>
                        <span className="text-xs text-muted-foreground">{n.subsidiary}</span>
                        <span className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!n.read && (
                      <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                        <BellOff className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alert Threshold Rules</CardTitle>
                <CardDescription>Configure when you want to be alerted about KPI changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${rule.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                        {rule.metric}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Alert when {rule.condition} threshold
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Threshold:</Label>
                      <Input
                        type="number"
                        value={rule.threshold}
                        onChange={(e) => updateThreshold(rule.id, parseFloat(e.target.value))}
                        className="w-20 h-8 text-sm"
                        disabled={!rule.enabled}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
