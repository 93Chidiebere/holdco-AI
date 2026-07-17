import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Subsidiary } from "@/types";

const getAuthHeaders = () => {
  const token = localStorage.getItem("holdco_token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Generic fetcher
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const fetcher = async (url: string, options?: RequestInit) => {
  const finalUrl = `${API_BASE_URL}${url}`;
  const headers: any = {
    ...getAuthHeaders(),
    ...options?.headers,
  };
  
  // If sending FormData, browser must set Content-Type with boundary automatically
  if (options?.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(finalUrl, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
};

export const api = {
  get: (url: string, options?: RequestInit) => fetcher(url, { ...options, method: 'GET' }).then(data => ({ data })),
  post: (url: string, body?: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return fetcher(url, {
      ...options,
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
    }).then(data => ({ data })); // wrap in {data} to match axios-like response expected by my code
  }
};

// Hooks for Subsidiaries
export function useSubsidiaries() {
  return useQuery({
    queryKey: ["subsidiaries"],
    queryFn: () => fetcher("/api/subsidiaries/"),
  });
}

export function useCreateSubsidiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Subsidiary>) =>
      fetcher("/api/subsidiaries/", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subsidiaries"] });
      toast.success("Subsidiary created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

// Hooks for KPIs
export function useKPIs() {
  return useQuery({
    queryKey: ["kpis"],
    queryFn: () => fetcher("/api/kpis/"),
  });
}

// Hooks for Insights
export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => fetcher("/api/insights/"),
  });
}

// Hooks for Capital Recommendations
export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => fetcher("/api/recommendations/"),
  });
}

// Seed Data
export function useSeedData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher("/api/platform/seed", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Dummy data generated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

// Hooks for Currency
export function useCurrency() {
  return useQuery({
    queryKey: ["currency"],
    queryFn: () => fetcher("/api/auth/holding-company/currency").then((res: any) => res.currency),
    staleTime: Infinity,
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currency: string) => fetcher("/api/auth/holding-company/currency", { 
      method: "PUT", 
      body: JSON.stringify({ currency }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currency"] });
      toast.success("Currency updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update currency");
    },
  });
}

export function useGeneratePortfolioInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher("/api/insights/generate-portfolio", { method: "POST" }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success(res.message || "Portfolio Analysis Complete!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to run portfolio analysis");
    },
  });
}

export function useSimulateScenario() {
  return useMutation({
    mutationFn: (prompt: string) => fetcher("/api/scenarios/simulate", { 
      method: "POST", 
      body: JSON.stringify({ prompt }) 
    }),
    onSuccess: () => {
      toast.success("Scenario Simulation Complete!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to run simulation");
    },
  });
}

// Hooks for Dashboard Data
export function useDashboardStats(currency: string, applyEliminations: boolean) {
  return useQuery({
    queryKey: ["dashboardStats", currency, applyEliminations],
    queryFn: () => fetcher(`/api/dashboard/stats?currency=${currency}&apply_eliminations=${applyEliminations}`),
  });
}

export function useRevenueTrend(currency: string, applyEliminations: boolean) {
  return useQuery({
    queryKey: ["revenueTrend", currency, applyEliminations],
    queryFn: () => fetcher(`/api/dashboard/revenue-trend?currency=${currency}&apply_eliminations=${applyEliminations}`),
  });
}

// System Data Hooks
export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetcher("/api/system/alerts"),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => fetcher("/api/system/audit-logs"),
  });
}
