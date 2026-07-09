import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInsights, useSubsidiaries, useGeneratePortfolioInsights } from "@/hooks/useApi";
import { AlertTriangle, TrendingUp, Shield, Zap, Activity, Brain } from "lucide-react";

const severityColors: Record<string, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function InsightsPage() {
  const { data: insights = [], isLoading } = useInsights();
  const { data: subsidiaries = [] } = useSubsidiaries();
  const { mutate: runPortfolioAnalysis, isPending: isGenerating } = useGeneratePortfolioInsights();

  const grouped = {
    critical: insights.filter((i: any) => i.severity === "critical"),
    high: insights.filter((i: any) => i.severity === "high"),
    medium: insights.filter((i: any) => i.severity === "medium"),
    low: insights.filter((i: any) => i.severity === "low"),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "risk": return <Shield className="w-5 h-5 text-destructive" />;
      case "opportunity": return <TrendingUp className="w-5 h-5 text-success" />;
      case "anomaly": return <Zap className="w-5 h-5 text-warning" />;
      case "trend": return <Activity className="w-5 h-5 text-info" />;
      default: return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground mt-1">Machine learning-powered anomaly detection and performance analysis</p>
          </div>
          <div className="ml-auto">
            <Button 
              onClick={() => runPortfolioAnalysis()} 
              disabled={isGenerating}
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              {isGenerating ? "Analyzing Portfolio..." : "Run Portfolio Analysis"}
            </Button>
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
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading insights...</div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight: any) => {
              const sub = subsidiaries.find((s: any) => s.id === insight.subsidiary_id);
              return (
                <Card key={insight.id} className="glass-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {getCategoryIcon(insight.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{insight.title}</h3>
                          <Badge variant="outline" className={severityColors[insight.severity as keyof typeof severityColors]}>
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                          <span className="text-xs font-medium text-sidebar-accent-foreground">
                            Target: {sub?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
