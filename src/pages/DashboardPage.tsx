import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockRevenueData } from "@/data/mockData";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle, Building2, Brain, ArrowUpRight, Database } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "react-router-dom";
import { useSubsidiaries, useKPIs, useInsights, useSeedData, useCurrency } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/utils";

const severityColors: Record<string, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function DashboardPage() {
  const { data: subsidiaries = [], isLoading: isLoadingSubs } = useSubsidiaries();
  const { data: kpis = [] } = useKPIs();
  const { data: insights = [] } = useInsights();
  const { mutate: seedData, isPending: isSeeding } = useSeedData();
  const { data: currencyCode = "NGN" } = useCurrency();
  const sym = getCurrencySymbol(currencyCode);

  const portfolioStats = [
    { label: "Total Revenue", value: `${sym}2.87B`, change: "+12.4%", trend: "up" as const, icon: DollarSign },
    { label: "Portfolio ROACE", value: "15.7%", change: "+2.1%", trend: "up" as const, icon: BarChart3 },
    { label: "Active Subsidiaries", value: subsidiaries.length.toString(), change: "0", trend: "flat" as const, icon: Building2 },
    { label: "Active Alerts", value: insights.filter((i: any) => i.severity === 'high' || i.severity === 'critical').length.toString(), change: "+1", trend: "down" as const, icon: AlertTriangle },
  ];

  const processedKPIs = subsidiaries.map((sub: any) => {
    const subKpis = kpis.filter((k: any) => k.subsidiary_id === sub.id);
    const roace = subKpis.find((k: any) => k.metric_name === 'roace')?.metric_value || 0;
    const revGrowth = subKpis.find((k: any) => k.metric_name === 'revenue_growth')?.metric_value || 0;
    return {
      subsidiary: sub.name,
      industry: sub.industry,
      roace: roace,
      revenue_growth: revGrowth
    };
  });

  const generatedRevenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, i) => {
      const data: any = { month };
      subsidiaries.forEach((sub: any, index: number) => {
        const base = 50 + (index * 20);
        data[sub.name] = base + (i * 5) + Math.random() * 15;
      });
      return data;
    });
  }, [subsidiaries]);

  const colors = ["hsl(160, 84%, 39%)", "hsl(217, 91%, 60%)", "hsl(0, 84%, 60%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)"];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-muted-foreground mt-1">Portfolio-wide performance overview</p>
          </div>
          {!isLoadingSubs && (
            <Button onClick={() => seedData()} disabled={isSeeding} variant="default" className="gap-2">
              <Database className="w-4 h-4" />
              {isSeeding ? "Seeding Data..." : "Seed Dummy Data"}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portfolioStats.map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                    {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
                    {stat.trend === "down" && <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Trend */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Revenue Trends (₦M)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generatedRevenueData}>
                    <defs>
                      {subsidiaries.map((sub: any, i: number) => (
                        <linearGradient key={sub.id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                    {subsidiaries.map((sub: any, i: number) => (
                      <Area key={sub.id} type="monotone" dataKey={sub.name} stroke={colors[i % colors.length]} fill={`url(#grad-${i})`} strokeWidth={2} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* KPI Comparison */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">ROACE by Subsidiary (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedKPIs} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis type="number" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                    <YAxis type="category" dataKey="subsidiary" stroke="hsl(220, 10%, 55%)" fontSize={11} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                    <Bar dataKey="roace" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Subsidiary Rankings */}
          <Card className="glass-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Subsidiary Performance</CardTitle>
              <Link to="/subsidiaries" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedKPIs.sort((a: any, b: any) => b.roace - a.roace).map((kpi: any, i: number) => {
                  return (
                    <div key={kpi.subsidiary} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{kpi.subsidiary}</p>
                          <p className="text-xs text-muted-foreground">{kpi.industry}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{kpi.roace}%</p>
                        <p className={`text-xs ${kpi.revenue_growth >= 0 ? "text-success" : "text-destructive"}`}>
                          {kpi.revenue_growth >= 0 ? "+" : ""}{kpi.revenue_growth}% rev
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="glass-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> AI Insights
              </CardTitle>
              <Link to="/insights" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.slice(0, 4).map((insight: any) => {
                  const sub = subsidiaries.find((s: any) => s.id === insight.subsidiary_id);
                  return (
                    <div key={insight.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{insight.title}</p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${severityColors[insight.severity]}`}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                      <p className="text-[10px] text-muted-foreground">{sub?.name}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
