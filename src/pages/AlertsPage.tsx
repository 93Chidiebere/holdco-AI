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

// Using real alerts from the backend.

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

import { useAlerts } from "@/hooks/useApi";

export default function AlertsPage() {
  const { data: fetchedAlerts = [] } = useAlerts();
  
  // We use local state to track "read" status since the backend currently doesn't persist it
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [rules, setRules] = useState(initialRules);

  const unreadCount = fetchedAlerts.filter((n: any) => !readAlerts.has(n.id)).length;

  const markAllRead = () => setReadAlerts(new Set(fetchedAlerts.map((n: any) => n.id)));

  const markRead = (id: string) => {
    setReadAlerts((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

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
            {fetchedAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No alerts generated. Add subsidiary data to generate AI insights.</p>
              </div>
            ) : (
              fetchedAlerts.map((n: any) => {
                const isRead = readAlerts.has(n.id);
                const cfg = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.info;
                const Icon = cfg.icon;
                return (
                  <Card key={n.id} className={`transition-all ${!isRead ? "border-primary/30 shadow-sm" : "opacity-75"}`}>
                    <CardContent className="flex items-start gap-4 py-4">
                      <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{n.title}</span>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant={cfg.badge} className="text-xs capitalize">{n.type}</Badge>
                          <span className="text-xs text-muted-foreground">{n.subsidiary}</span>
                          <span className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {!isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                          <BellOff className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
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
