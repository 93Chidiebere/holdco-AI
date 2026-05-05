import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockInsights } from "@/data/mockData";
import { AlertTriangle, TrendingUp, Shield, Zap, Activity, Brain } from "lucide-react";

const typeIcons: Record<string, typeof AlertTriangle> = {
  anomaly: AlertTriangle,
  alert: Zap,
  risk: Shield,
  opportunity: TrendingUp,
  trend: Activity,
};

const severityColors: Record<string, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const typeColors: Record<string, string> = {
  anomaly: "text-warning",
  alert: "text-destructive",
  risk: "text-destructive",
  opportunity: "text-success",
  trend: "text-info",
};

export default function InsightsPage() {
  const grouped = {
    critical: mockInsights.filter(i => i.severity === "critical"),
    high: mockInsights.filter(i => i.severity === "high"),
    medium: mockInsights.filter(i => i.severity === "medium"),
    low: mockInsights.filter(i => i.severity === "low"),
  };

  const allSorted = [...grouped.critical, ...grouped.high, ...grouped.medium, ...grouped.low];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground mt-1">Machine learning-powered anomaly detection and performance analysis</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["critical", "high", "medium", "low"] as const).map(sev => (
            <Card key={sev} className="glass-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground capitalize">{sev} Severity</p>
                  <p className="text-2xl font-bold mt-1">{grouped[sev].length}</p>
                </div>
                <Badge variant="outline" className={`${severityColors[sev]} text-xs`}>{sev}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {allSorted.map((insight, i) => {
            const Icon = typeIcons[insight.type] || Activity;
            return (
              <Card key={insight.id} className="glass-card animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${typeColors[insight.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-semibold">{insight.title}</h3>
                          <p className="text-xs text-muted-foreground">{insight.subsidiary_name} · {insight.created_at}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant="outline" className={`${severityColors[insight.severity]} text-xs`}>{insight.severity}</Badge>
                          <Badge variant="secondary" className="text-xs capitalize">{insight.type}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
