import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, ArrowRightLeft, TrendingUp, TrendingDown, RotateCcw, Brain, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";
import { useSubsidiaries, useKPIs, useSimulateScenario } from "@/hooks/useApi";

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export default function ScenarioPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("manage_scenarios");
  
  const { data: subsidiaries = [] } = useSubsidiaries();
  const { data: kpis = [] } = useKPIs();
  const { mutateAsync: simulateScenario, isPending: isSimulating } = useSimulateScenario();

  const baseKPIs = useMemo(() => {
    return subsidiaries.map((sub: any) => {
      const subKpis = kpis.filter((k: any) => k.subsidiary_id === sub.id);
      const roace = subKpis.find((k: any) => k.name?.toLowerCase().includes('roace'))?.value || 0;
      return {
        subsidiary: sub.name,
        roace: roace,
      };
    });
  }, [subsidiaries, kpis]);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState(50);
  
  // AI Simulation State
  const [aiPrompt, setAiPrompt] = useState("What happens to our portfolio cash flow if our agriculture subsidiary's revenue drops 30% due to weather, and the Naira devalues by 15%?");
  const [aiResults, setAiResults] = useState<any>(null);
  const [aiNarrative, setAiNarrative] = useState<string>("");

  const addTransfer = () => {
    if (!from || !to || from === to) return;
    setTransfers((prev) => [...prev, { from, to, amount: amount * 1_000_000 }]);
    setFrom("");
    setTo("");
    setAmount(50);
  };

  const reset = () => setTransfers([]);

  // Simulate impact on ROACE (Manual)
  const simulatedData = useMemo(() => {
    const baseData = baseKPIs.map((k: any) => ({ ...k, simulated_roace: k.roace }));

    transfers.forEach((t) => {
      const fromSub = baseData.find((d: any) => d.subsidiary === t.from);
      const toSub = baseData.find((d: any) => d.subsidiary === t.to);
      if (fromSub) fromSub.simulated_roace = Math.max(0, fromSub.simulated_roace - (t.amount / 1e8) * 1.2);
      if (toSub) toSub.simulated_roace = toSub.simulated_roace + (t.amount / 1e8) * 1.8;
    });

    return baseData.map((d: any) => ({
      subsidiary: d.subsidiary,
      baseline: d.roace,
      simulated: Math.round(d.simulated_roace * 10) / 10,
      delta: Math.round((d.simulated_roace - d.roace) * 10) / 10,
    }));
  }, [transfers, baseKPIs]);

  const totalMoved = transfers.reduce((s, t) => s + t.amount, 0);
  const subNames = baseKPIs.map((k: any) => k.subsidiary);

  const handleRunAISimulation = async () => {
    if (!aiPrompt) return;
    const response = await simulateScenario(aiPrompt);
    if (response?.results) {
      setAiResults(response.results);
      setAiNarrative(response.narrative || "");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scenario Modeling</h1>
            <p className="text-muted-foreground mt-1">Simulate capital reallocation and macro-economic shocks</p>
          </div>
        </div>

        <Tabs defaultValue="ai" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="ai" className="gap-2"><Brain className="w-4 h-4"/> AI Macro Engine</TabsTrigger>
            <TabsTrigger value="manual" className="gap-2"><ArrowRightLeft className="w-4 h-4"/> Manual Reallocation</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card className="glass-card mb-6">
              <CardHeader>
                <CardTitle>Rigorous Quantitative Simulation</CardTitle>
                <CardDescription>
                  The AI acts as your Group CFO. It fetches live macro-economic data (FX, Inflation) and mathematically models your proposed scenario over a 12-month period based on actual historical subsidiary data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="e.g. What happens if the Naira drops 10% next month?"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <PermissionTooltip hasPermission={canManage} message="Only admins can run simulations.">
                    <Button onClick={handleRunAISimulation} disabled={!canManage || isSimulating || !aiPrompt} className="gap-2">
                      <Brain className="w-4 h-4" />
                      {isSimulating ? "Modeling 12-Month Projection..." : "Run AI Simulation"}
                    </Button>
                  </PermissionTooltip>
                </div>
              </CardContent>
            </Card>

            {aiResults && aiResults.length > 0 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" /> 12-Month Projection Results</h2>
                
                {aiNarrative && (
                  <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                    <div className="flex gap-3 items-start">
                      <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="leading-relaxed whitespace-pre-wrap text-foreground/90">{aiNarrative}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {aiResults.map((res: any, idx: number) => (
                    <Card key={idx} className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-base">{res.subsidiary} - Projected Cash & Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={res.projection}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                              <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(val) => `Mo ${val}`} />
                              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} width={65} tickFormatter={(val) => val >= 1e9 ? `₦${(val / 1e9).toFixed(1)}B` : val >= 1e6 ? `₦${(val / 1e6).toFixed(0)}M` : val >= 1e3 ? `₦${(val / 1e3).toFixed(0)}k` : `₦${val}`} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px" }} 
                                formatter={(value: number) => [`₦${value >= 1e9 ? (value / 1e9).toFixed(2) + 'B' : value >= 1e6 ? (value / 1e6).toFixed(2) + 'M' : value >= 1e3 ? (value / 1e3).toFixed(2) + 'k' : value.toLocaleString()}`, undefined]}
                                labelFormatter={(val) => `Month ${val}`}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} name="Revenue" />
                              <Line type="monotone" dataKey="cash" stroke="hsl(160, 84%, 39%)" strokeWidth={2} name="Cash Reserve" />
                              <Line type="monotone" dataKey="opex" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="OPEX" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Capital Transfer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>From Subsidiary</Label>
                    <Select value={from} onValueChange={setFrom}>
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>{subNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Subsidiary</Label>
                    <Select value={to} onValueChange={setTo}>
                      <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                      <SelectContent>{subNames.filter((n) => n !== from).map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount: ₦{amount}M</Label>
                    <Slider value={[amount]} onValueChange={(v) => setAmount(v[0])} min={10} max={500} step={10} />
                  </div>
                  <PermissionTooltip hasPermission={canManage} message="Only admins can add scenario transfers.">
                    <Button onClick={addTransfer} disabled={!canManage || !from || !to || from === to} className="w-full">
                      <ArrowRightLeft className="w-4 h-4 mr-2" /> Add Transfer
                    </Button>
                  </PermissionTooltip>

                  {transfers.length > 0 && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Transfers ({transfers.length})</p>
                        <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
                      </div>
                      {transfers.map((t, i) => (
                        <div key={i} className="text-xs p-2 rounded-lg bg-muted/50 flex items-center gap-2">
                          <span className="font-medium">{t.from}</span>
                          <ArrowRightLeft className="w-3 h-3 text-primary shrink-0" />
                          <span className="font-medium">{t.to}</span>
                          <span className="ml-auto text-primary font-semibold">₦{t.amount / 1e6}M</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground pt-1">Total moved: ₦{totalMoved / 1e6}M</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results */}
              <Card className="glass-card lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Projected ROACE Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simulatedData} layout="vertical" barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                        <XAxis type="number" stroke="hsl(220, 10%, 55%)" fontSize={12} unit="%" />
                        <YAxis type="category" dataKey="subsidiary" stroke="hsl(220, 10%, 55%)" fontSize={11} width={100} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(220, 25%, 12%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: "8px", color: "hsl(220, 10%, 93%)" }} />
                        <Bar dataKey="baseline" fill="hsl(220, 20%, 30%)" radius={[0, 4, 4, 0]} name="Current" />
                        <Bar dataKey="simulated" radius={[0, 4, 4, 0]} name="Projected">
                          {simulatedData.map((d, i) => (
                            <Cell key={i} fill={d.delta >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delta Summary */}
            {transfers.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
                {simulatedData.map((d) => (
                  <Card key={d.subsidiary} className="glass-card">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{d.subsidiary}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{d.simulated}%</span>
                        <span className={`text-xs font-medium flex items-center gap-0.5 ${d.delta >= 0 ? "text-success" : "text-destructive"}`}>
                          {d.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {d.delta >= 0 ? "+" : ""}{d.delta}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
