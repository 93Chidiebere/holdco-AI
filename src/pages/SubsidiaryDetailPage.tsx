import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockSubsidiaries, mockKPIData, mockNormalizedData, mockInsights } from "@/data/mockData";
import { ArrowLeft, TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const kpiLabels: Record<string, { label: string; unit: string }> = {
  roace: { label: "ROACE", unit: "%" },
  ebitda_margin: { label: "EBITDA Margin", unit: "%" },
  revenue_growth: { label: "Revenue Growth", unit: "%" },
  liquidity: { label: "Liquidity Ratio", unit: "x" },
  debt_equity: { label: "Debt/Equity", unit: "x" },
};

export default function SubsidiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sub = mockSubsidiaries.find((s) => s.id === id);
  const kpiKey = sub?.name.split(" ")[0] || "";
  const kpi = mockKPIData.find((k) => k.subsidiary.startsWith(kpiKey));
  const financials = mockNormalizedData.filter((d) => d.subsidiary_id === id);
  const insights = mockInsights.filter((i) => i.subsidiary_id === id);

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

  const kpiCards = kpi
    ? Object.entries(kpiLabels).map(([key, meta]) => ({
        ...meta,
        value: (kpi as any)[key] as number,
        isPositive: key === "debt_equity" ? (kpi as any)[key] < 1 : (kpi as any)[key] > 0,
      }))
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiCards.map((k) => (
            <Card key={k.label} className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-bold">{k.value}</span>
                  <span className="text-xs text-muted-foreground mb-0.5">{k.unit}</span>
                  {k.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-success ml-auto" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-destructive ml-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Revenue & Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financials}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="date" stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(160, 84%, 39%)" fill="url(#revGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Assets vs Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financials}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="date" stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                    <Bar dataKey="assets" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="liabilities" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">AI Insights for {sub.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight) => (
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
