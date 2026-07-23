import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock, Zap, Target, Users, BarChart3, Database } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Visualizers for different job types
const ExecutiveSummaryVisualizer = ({ result }: { result: any }) => {
  const data = result.llm_interpretation || result;
  if (!data) return <p>No data available.</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{data.memo_title || "Executive Summary"}</h3>
      <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-700">
        <p>{data.executive_summary}</p>
      </div>
      {data.key_bullet_points && (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
          {data.key_bullet_points.map((point: string, i: number) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      )}
      {data.board_level_recommendation && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 p-3 rounded-md">
          <p className="text-sm font-medium text-emerald-800">Recommendation:</p>
          <p className="text-sm text-emerald-700">{data.board_level_recommendation}</p>
        </div>
      )}
    </div>
  );
};

const PredictiveChurnVisualizer = ({ result }: { result: any }) => {
  const summary = result.summary || {};
  const llm = result.llm_interpretation || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-50 p-3 rounded text-center border border-red-100">
          <p className="text-xs text-red-600 font-medium">High Risk</p>
          <p className="text-xl font-bold text-red-700">{summary.high_risk || 0}</p>
        </div>
        <div className="bg-amber-50 p-3 rounded text-center border border-amber-100">
          <p className="text-xs text-amber-600 font-medium">Medium Risk</p>
          <p className="text-xl font-bold text-amber-700">{summary.medium_risk || 0}</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded text-center border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium">Low Risk</p>
          <p className="text-xl font-bold text-emerald-700">{summary.low_risk || 0}</p>
        </div>
      </div>
      
      {llm.risk_analysis && (
        <div className="text-sm text-slate-700 mt-2">
          <p className="font-medium mb-1">Analysis:</p>
          <p>{llm.risk_analysis}</p>
        </div>
      )}
      {llm.retention_strategy && (
        <div className="text-sm bg-blue-50 border border-blue-100 p-3 rounded-md text-blue-800 mt-2">
          <p className="font-medium mb-1">Retention Strategy:</p>
          <p>{llm.retention_strategy}</p>
        </div>
      )}
    </div>
  );
};

const ClusterAnalysisVisualizer = ({ result }: { result: any }) => {
  const llm = result.llm_interpretation || {};
  const clusters = Object.keys(llm).filter(k => k.startsWith('cluster_'));

  return (
    <div className="space-y-4">
      {llm.overall_insight && (
        <p className="text-sm font-medium text-slate-700 bg-slate-100 p-2 rounded">{llm.overall_insight}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {clusters.map((key) => (
          <div key={key} className="border p-3 rounded-md shadow-sm">
            <h4 className="font-semibold text-primary">{llm[key].persona_name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{llm[key].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CapitalAllocationVisualizer = ({ result }: { result: any }) => {
  const data = result;
  const llm = result.llm_interpretation || {};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded border">
        <div>
          <p className="text-xs text-muted-foreground">Total Budget</p>
          <p className="font-semibold">${(data.total_available || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Allocated</p>
          <p className="font-semibold text-emerald-600">${(data.total_allocated || 0).toLocaleString()}</p>
        </div>
      </div>

      {llm.strategic_summary && (
        <p className="text-sm text-slate-700 italic border-l-2 border-primary pl-2">{llm.strategic_summary}</p>
      )}

      {data.allocations && data.allocations.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Funded Projects</p>
          <div className="space-y-2">
            {data.allocations.map((alloc: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b pb-1">
                <span>{alloc.unit_name || alloc.unit_id}</span>
                <span className="font-medium text-emerald-600">${(alloc.allocated || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GenericJsonVisualizer = ({ result }: { result: any }) => {
  return (
    <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-xs font-mono">
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
};

export default function ApiDashboardPage() {
  const fetchJobs = async () => {
    const token = localStorage.getItem("holdco_token");
    const res = await fetch(`${API_BASE_URL}/api/keys/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch jobs");
    return res.json();
  };

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['asyncJobs'],
    queryFn: fetchJobs,
    refetchInterval: 10000 // Poll every 10s
  });

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j: any) => j.status === 'completed').length;
  const failedJobs = jobs.filter((j: any) => j.status === 'failed').length;
  const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

  const renderJobVisualizer = (job: any) => {
    if (!job.result || job.status !== 'completed') {
      return (
        <div className="text-center p-6 text-slate-400">
          {job.status === 'processing' ? 'Processing data...' : job.status === 'failed' ? `Error: ${job.error}` : 'Waiting for results...'}
        </div>
      );
    }

    switch (job.job_type) {
      case 'executive_summary':
        return <ExecutiveSummaryVisualizer result={job.result} />;
      case 'predictive_churn':
        return <PredictiveChurnVisualizer result={job.result} />;
      case 'cluster_analysis':
        return <ClusterAnalysisVisualizer result={job.result} />;
      case 'capital_allocation':
        return <CapitalAllocationVisualizer result={job.result} />;
      default:
        return <GenericJsonVisualizer result={job.result} />;
    }
  };

  const getJobIcon = (type: string) => {
    switch(type) {
      case 'executive_summary': return <Target className="w-5 h-5 text-purple-500" />;
      case 'predictive_churn': return <Users className="w-5 h-5 text-red-500" />;
      case 'cluster_analysis': return <Database className="w-5 h-5 text-blue-500" />;
      case 'capital_allocation': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'forecast': return <BarChart3 className="w-5 h-5 text-emerald-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">API Workspace</h1>
        <p className="text-slate-500 mt-2">Visualizing backend insights generated by your HoldCo AI endpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total API Requests</p>
              <p className="text-3xl font-bold">{totalJobs}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Success Rate</p>
              <p className="text-3xl font-bold">{successRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Failed Requests</p>
              <p className="text-3xl font-bold">{failedJobs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Recent API Insights</h2>
        
        {isLoading ? (
          <p className="text-muted-foreground">Loading workspace data...</p>
        ) : jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No API requests have been processed yet.</p>
              <p className="text-sm mt-2">Use the Developer Settings to generate an API key and trigger endpoints.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {jobs.map((job: any) => (
              <Card key={job.id} className="overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getJobIcon(job.job_type)}
                      <div>
                        <CardTitle className="text-lg capitalize tracking-tight">
                          {job.job_type.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono mt-1">
                          ID: {job.id.substring(0, 8)} • {new Date(job.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}
                      className={job.status === "completed" ? "bg-emerald-500" : ""}
                    >
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 overflow-y-auto max-h-[400px]">
                  {renderJobVisualizer(job)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
