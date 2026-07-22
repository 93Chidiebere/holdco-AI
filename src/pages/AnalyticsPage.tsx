import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubsidiaries, useKPIs } from "@/hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";

const kpiCards = [
  { key: "roace", label: "Avg ROACE", unit: "%" },
  { key: "ebitda_margin", label: "Avg EBITDA Margin", unit: "%" },
  { key: "revenue_growth", label: "Avg Inflow Growth", unit: "%" },
  { key: "liquidity", label: "Avg Liquidity Ratio", unit: "x" },
  { key: "debt_equity", label: "Avg Debt/Equity", unit: "x" },
];

export default function AnalyticsPage() {
  const { data: subsidiaries = [], isLoading: isLoadingSubs } = useSubsidiaries();
  const { data: kpis = [] } = useKPIs();

  const processedKPIs = useMemo(() => {
    return subsidiaries.map((sub: any) => {
      const subKpis = kpis.filter((k: any) => k.subsidiary_id === sub.id);
      return {
        subsidiary: sub.name,
        roace: subKpis.find((k: any) => k.name.toLowerCase().includes('roace'))?.value || 0,
        ebitda_margin: subKpis.find((k: any) => k.name.toLowerCase().includes('ebitda'))?.value || 15,
        revenue_growth: subKpis.find((k: any) => k.name.toLowerCase().includes('inflow'))?.value || 0,
        liquidity: subKpis.find((k: any) => k.name.toLowerCase().includes('liquidity'))?.value || 1.5,
        debt_equity: subKpis.find((k: any) => k.name.toLowerCase().includes('debt'))?.value || 0.8,
      };
    });
  }, [subsidiaries, kpis]);

  const radarData = useMemo(() => {
    return processedKPIs.map(k => ({
      subsidiary: k.subsidiary,
      ROACE: k.roace,
      EBITDA: k.ebitda_margin,
      Growth: Math.max(0, k.revenue_growth) * 3,
      Liquidity: k.liquidity * 10,
      Safety: Math.max(0, (2 - k.debt_equity)) * 15,
    }));
  }, [processedKPIs]);

  const avgKPIs = useMemo(() => {
    if (processedKPIs.length === 0) return kpiCards.map(k => ({ ...k, value: "0.0", positive: true }));
    return kpiCards.map(kpi => {
      const values = processedKPIs.map(d => d[kpi.key as keyof typeof d] as number);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { ...kpi, value: avg.toFixed(1), positive: avg > 0 };
    });
  }, [processedKPIs]);

  const generatedInflowData = useMemo(() => {
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

  if (isLoadingSubs) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">KPI Analytics</h1>
          <p className="text-muted-foreground mt-1">Financial performance metrics across your portfolio</p>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {avgKPIs.map(kpi => (
            <Card key={kpi.key} className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-bold">{kpi.value}</span>
                  <span className="text-xs text-muted-foreground mb-0.5">{kpi.unit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="comparison" className="space-y-4">
          <TabsList>
            <TabsTrigger value="comparison">KPI Comparison</TabsTrigger>
            <TabsTrigger value="radar">Radar View</TabsTrigger>
            <TabsTrigger value="trends">Inflow Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-base">EBITDA Margin (%)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedKPIs}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                        <XAxis dataKey="subsidiary" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                        <Bar dataKey="ebitda_margin" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-base">Inflow Growth (%)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedKPIs}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                        <XAxis dataKey="subsidiary" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                        <Bar dataKey="revenue_growth" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="radar">
            <Card className="glass-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">Multi-Dimensional Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData.length > 0 ? [
                      { metric: "ROACE", ...Object.fromEntries(radarData.map(d => [d.subsidiary, d.ROACE])) },
                      { metric: "EBITDA", ...Object.fromEntries(radarData.map(d => [d.subsidiary, d.EBITDA])) },
                      { metric: "Growth", ...Object.fromEntries(radarData.map(d => [d.subsidiary, d.Growth])) },
                      { metric: "Liquidity", ...Object.fromEntries(radarData.map(d => [d.subsidiary, d.Liquidity])) },
                      { metric: "Safety", ...Object.fromEntries(radarData.map(d => [d.subsidiary, d.Safety])) },
                    ] : []}>
                      <PolarGrid stroke="hsl(220, 20%, 18%)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }} />
                      {subsidiaries.map((sub: any, i: number) => (
                        <Radar key={sub.id} name={sub.name} dataKey={sub.name} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.15} />
                      ))}
                      <Legend wrapperStyle={{ color: "hsl(220, 10%, 55%)" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="glass-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">Inflow Trends</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {generatedInflowData.length === 1 ? (
                      <BarChart data={generatedInflowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                        <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                        <Legend wrapperStyle={{ color: "hsl(220, 10%, 55%)" }} />
                        {subsidiaries.map((sub: any, i: number) => (
                          <Bar key={sub.id} dataKey={sub.name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart data={generatedInflowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                        <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                        <Legend wrapperStyle={{ color: "hsl(220, 10%, 55%)" }} />
                        {subsidiaries.map((sub: any, i: number) => (
                          <Line key={sub.id} type="monotone" dataKey={sub.name} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                        ))}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detailed KPI Table */}
        <Card className="glass-card">
          <CardHeader className="pb-3"><CardTitle className="text-base">KPI Breakdown by Subsidiary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Subsidiary</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">ROACE</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">EBITDA Margin</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Rev Growth</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Liquidity</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">D/E Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {processedKPIs.map(kpi => (
                    <tr key={kpi.subsidiary} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{kpi.subsidiary}</td>
                      <td className="text-right py-3 px-4">{kpi.roace}%</td>
                      <td className="text-right py-3 px-4">{kpi.ebitda_margin}%</td>
                      <td className="text-right py-3 px-4">
                        <span className={`inline-flex items-center gap-1 ${kpi.revenue_growth >= 0 ? "text-success" : "text-destructive"}`}>
                          {kpi.revenue_growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {kpi.revenue_growth}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">{kpi.liquidity}x</td>
                      <td className="text-right py-3 px-4">
                        <span className={kpi.debt_equity > 1 ? "text-destructive" : ""}>{kpi.debt_equity}x</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
