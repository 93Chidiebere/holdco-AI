// Types for HoldCo AI platform

export interface HoldingCompany {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "analyst" | "viewer";
  avatar?: string;
  holding_company_id: string;
  holding_company_name: string;
}

export interface Subsidiary {
  id: string;
  name: string;
  industry: string;
  country: string;
  currency: string;
  description: string;
  created_at: string;
}

export type ReportType = "income_statement" | "balance_sheet" | "cash_flow" | "operational_metrics";

export type ReportingPeriod = "monthly" | "quarterly" | "yearly";

export interface FinancialReport {
  id: string;
  subsidiary_id: string;
  report_type: ReportType;
  reporting_period: ReportingPeriod;
  file_name: string;
  uploaded_at: string;
  status: "pending" | "mapped" | "normalized" | "error";
}

export interface ColumnMapping {
  source_column: string;
  target_field: string;
}

export interface NormalizedData {
  subsidiary_id: string;
  date: string;
  revenue: number;
  expenses: number;
  net_income: number;
  cash: number;
  debt: number;
  assets: number;
  liabilities: number;
  equity: number;
  operating_costs: number;
}

export interface KPI {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "flat";
  change: number;
}

export interface AIInsight {
  id: string;
  type: "anomaly" | "alert" | "risk" | "opportunity" | "trend";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  subsidiary_id: string;
  subsidiary_name: string;
  created_at: string;
}

export interface CapitalRecommendation {
  id: string;
  type: "reallocation" | "internal_loan" | "cost_reduction" | "growth_investment" | "risk_alert";
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  from_subsidiary?: string;
  to_subsidiary?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "approved" | "rejected" | "deferred";
  assigned_to?: string;
  decided_at?: string;
  decided_by?: string;
  notes?: string;
  created_at: string;
}
