import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockSubsidiaries, mockRevenueData, mockKPIData, mockInsights, mockRecommendations } from "@/data/mockData";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle, Building2, Brain, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "react-router-dom";

const portfolioStats = [
  { label: "Total Revenue", value: "₦2.87B", change: "+12.4%", trend: "up" as const, icon: DollarSign },
  { label: "Portfolio ROACE", value: "15.7%", change: "+2.1%", trend: "up" as const, icon: BarChart3 },
  { label: "Active Subsidiaries", value: "5", change: "0", trend: "flat" as const, icon: Building2 },
  { label: "Active Alerts", value: "3", change: "+1", trend: "down" as const, icon: AlertTriangle },
];

const severityColors: Record<string, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Portfolio-wide performance overview</p>
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
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                    <Area type="monotone" dataKey="TechVentures" stroke="hsl(160, 84%, 39%)" fill="url(#grad1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="FinServe" stroke="hsl(217, 91%, 60%)" fill="url(#grad2)" strokeWidth={2} />
                    <Area type="monotone" dataKey="MediCare" stroke="hsl(38, 92%, 50%)" fill="none" strokeWidth={2} />
                    <Area type="monotone" dataKey="AgriGrowth" stroke="hsl(280, 65%, 60%)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="EnergyPrime" stroke="hsl(0, 84%, 60%)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
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
                  <BarChart data={mockKPIData} layout="vertical">
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
                {mockKPIData.sort((a, b) => b.roace - a.roace).map((kpi, i) => {
                  const sub = mockSubsidiaries.find(s => s.name.startsWith(kpi.subsidiary.split(" ")[0]));
                  return (
                    <div key={kpi.subsidiary} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{kpi.subsidiary}</p>
                          <p className="text-xs text-muted-foreground">{sub?.industry}</p>
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
                {mockInsights.slice(0, 4).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{insight.title}</p>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${severityColors[insight.severity]}`}>
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                    <p className="text-[10px] text-muted-foreground">{insight.subsidiary_name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
