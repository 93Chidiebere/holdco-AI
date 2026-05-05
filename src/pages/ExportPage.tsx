import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Download, Calendar, Building2, BarChart3, Brain, Wallet } from "lucide-react";
import { mockSubsidiaries, mockKPIData, mockRecommendations, mockInsights } from "@/data/mockData";
import { toast } from "@/components/ui/sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";

const reportSections = [
  { id: "executive_summary", label: "Executive Summary", icon: FileText },
  { id: "kpi_overview", label: "KPI Performance Overview", icon: BarChart3 },
  { id: "subsidiary_breakdown", label: "Subsidiary Breakdown", icon: Building2 },
  { id: "ai_insights", label: "AI Insights & Alerts", icon: Brain },
  { id: "capital_recommendations", label: "Capital Recommendations", icon: Wallet },
];

const pastReports = [
  { id: "1", name: "Q4 2025 Board Report", date: "2026-01-05", sections: 5, format: "PDF" },
  { id: "2", name: "February 2026 Monthly Review", date: "2026-03-01", sections: 3, format: "PDF" },
  { id: "3", name: "EnergyPrime Risk Assessment", date: "2026-03-07", sections: 2, format: "PDF" },
];

export default function ExportPage() {
  const { hasPermission } = usePermissions();
  const canExport = hasPermission("export_reports");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedSections, setSelectedSections] = useState<string[]>(reportSections.map((s) => s.id));
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id: string) =>
    setSelectedSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("Board report generated successfully", {
        description: `${selectedSections.length} sections included for ${selectedPeriod} period.`,
      });
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Board / Report Export</h1>
          <p className="text-muted-foreground">Generate board-ready portfolio summaries and reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Builder */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>Select the sections and period for your board report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Reporting Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Report Sections</Label>
                  {reportSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Checkbox
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={() => toggleSection(section.id)}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{section.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <PermissionTooltip hasPermission={canExport} message="You need export permissions to generate reports.">
                    <Button onClick={generateReport} disabled={!canExport || generating || selectedSections.length === 0}>
                      {generating ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Generating...
                        </span>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-1" /> Generate Report
                        </>
                      )}
                    </Button>
                  </PermissionTooltip>
                  <span className="text-sm text-muted-foreground">
                    {selectedSections.length} section{selectedSections.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSections.includes("executive_summary") && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">Executive Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Portfolio of {mockSubsidiaries.length} subsidiaries across {new Set(mockSubsidiaries.map((s) => s.industry)).size} industries.
                      Average ROACE: {(mockKPIData.reduce((a, k) => a + k.roace, 0) / mockKPIData.length).toFixed(1)}%.
                      {mockInsights.filter((i) => i.severity === "critical").length} critical alerts require immediate attention.
                      {mockRecommendations.length} capital recommendations pending review.
                    </p>
                  </div>
                )}
                {selectedSections.includes("kpi_overview") && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">KPI Performance Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mockKPIData.map((kpi) => (
                        <div key={kpi.subsidiary} className="text-sm">
                          <p className="font-medium text-foreground">{kpi.subsidiary}</p>
                          <p className="text-muted-foreground">ROACE: {kpi.roace}% | Growth: {kpi.revenue_growth}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedSections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Select sections above to preview the report</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Past Reports */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Past Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pastReports.map((report) => (
                  <div key={report.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium text-foreground">{report.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{report.format}</Badge>
                      <span className="text-xs text-muted-foreground">{report.date}</span>
                    </div>
                    <PermissionTooltip hasPermission={canExport} message="You need export permissions to download reports.">
                      <Button variant="ghost" size="sm" className="w-full mt-1" disabled={!canExport}>
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                    </PermissionTooltip>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
