import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Leaf, Users, ShieldCheck, Zap, Droplets, HeartHandshake, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const mockCarbonData = [
  { month: "Jan", emissions: 1200 },
  { month: "Feb", emissions: 1150 },
  { month: "Mar", emissions: 1100 },
  { month: "Apr", emissions: 1080 },
  { month: "May", emissions: 1050 },
  { month: "Jun", emissions: 980 },
];

const mockDiversityData = [
  { category: "Executive", percentage: 35 },
  { category: "Management", percentage: 42 },
  { category: "Workforce", percentage: 48 },
];

export default function ESGPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-emerald-500" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ESG Command Center</h1>
              <p className="text-muted-foreground mt-1">Monitor environmental, social, and governance metrics across all subsidiaries.</p>
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <TrendingDown className="w-3 h-3 mr-1" /> 12%
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Carbon Emissions</p>
              <h3 className="text-2xl font-bold">980 <span className="text-sm font-normal text-muted-foreground">MT CO2e</span></h3>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <TrendingDown className="w-3 h-3 mr-1" /> 5%
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Energy Consumption</p>
              <h3 className="text-2xl font-bold">14,200 <span className="text-sm font-normal text-muted-foreground">MWh</span></h3>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  +3% YTD
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Women in Leadership</p>
              <h3 className="text-2xl font-bold">35%</h3>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5 text-amber-500" />
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  On Track
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Community Spend</p>
              <h3 className="text-2xl font-bold">$2.4M</h3>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Carbon Emissions Trend</CardTitle>
              <CardDescription>Monthly CO2 equivalent reduction progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockCarbonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Gender Diversity Targets</CardTitle>
              <CardDescription>Current percentage vs. 2026 targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mt-4">
                {mockDiversityData.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">{item.percentage}% / 50% Target</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
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
