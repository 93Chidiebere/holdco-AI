import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Building2, Link as LinkIcon, Check, Copy } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useSubsidiaries, useKPIs, useInsights, api } from "@/hooks/useApi";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";

const kpiLabels: Record<string, { label: string; unit: string }> = {
  roace: { label: "Surplus Margin", unit: "%" },
  revenue_growth: { label: "Inflow Growth", unit: "%" },
};

export default function SubsidiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: subsidiaries = [] } = useSubsidiaries();
  const { data: kpis = [] } = useKPIs();
  const { data: insightsData = [] } = useInsights();
  const { hasPermission } = usePermissions();
  
  const canManage = hasPermission("manage_subsidiaries");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const sub = subsidiaries.find((s: any) => s.id === id);
  const subKpis = kpis.filter((k: any) => k.subsidiary_id === id);
  const insights = insightsData.filter((i: any) => i.subsidiary_id === id);

  if (!sub) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Subsidiary not found</p>
          <Button variant="outline" asChild><Link to="/subsidiaries"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post('/api/portal/generate-token', { subsidiary_id: sub.id });
      const link = `${window.location.origin}/portal/${response.data.token}`;
      setGeneratedLink(link);
      toast.success("Secure upload link generated");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to generate link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild><Link to="/subsidiaries"><ArrowLeft className="w-5 h-5" /></Link></Button>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{sub.name}</h1>
              <p className="text-muted-foreground text-sm">{sub.industry} · {sub.country} · {sub.currency}</p>
            </div>
          </div>
          
          <PermissionTooltip hasPermission={canManage} message="Only admins can generate upload links.">
            <Button onClick={handleGenerateLink} disabled={!canManage || isGenerating} variant="outline" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate Upload Link"}
            </Button>
          </PermissionTooltip>
        </div>

        {generatedLink && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between gap-3 animate-fade-in border border-border">
            <div className="truncate text-sm font-mono text-muted-foreground">{generatedLink}</div>
            <Button size="sm" variant="secondary" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {subKpis.map((k: any) => (
            <Card key={k.name} className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 capitalize">{k.name.replace(/_/g, " ")}</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-bold">{k.value}</span>
                  <span className="text-xs text-muted-foreground mb-0.5">{k.unit}</span>
                  {k.trend === "up" ? (
                    <TrendingUp className="w-3.5 h-3.5 text-success ml-auto" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-destructive ml-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">AI Insights for {sub.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight: any) => (
                  <div key={insight.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${
                        insight.severity === "critical" ? "bg-destructive/20 text-destructive border-destructive/30" :
                        insight.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        insight.severity === "medium" ? "bg-warning/10 text-warning border-warning/20" :
                        "bg-info/10 text-info border-info/20"
                      }`}>{insight.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
