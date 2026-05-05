import type { Subsidiary, AIInsight, CapitalRecommendation, NormalizedData } from "@/types";

export const mockSubsidiaries: Subsidiary[] = [
  { id: "1", name: "TechVentures Ltd", industry: "Technology", country: "Nigeria", currency: "NGN", description: "Software development and IT services", created_at: "2024-01-15" },
  { id: "2", name: "AgriGrowth Corp", industry: "Agriculture", country: "Kenya", currency: "KES", description: "Large-scale farming and agro-processing", created_at: "2024-02-20" },
  { id: "3", name: "FinServe Holdings", industry: "Financial Services", country: "South Africa", currency: "ZAR", description: "Microfinance and insurance", created_at: "2024-03-10" },
  { id: "4", name: "EnergyPrime", industry: "Energy", country: "Ghana", currency: "GHS", description: "Renewable energy generation", created_at: "2024-04-05" },
  { id: "5", name: "MediCare Group", industry: "Healthcare", country: "Nigeria", currency: "NGN", description: "Hospital chain and pharmaceutical distribution", created_at: "2024-05-12" },
];

export const mockRevenueData = [
  { month: "Jul", TechVentures: 420, AgriGrowth: 280, FinServe: 350, EnergyPrime: 190, MediCare: 310 },
  { month: "Aug", TechVentures: 450, AgriGrowth: 310, FinServe: 340, EnergyPrime: 210, MediCare: 330 },
  { month: "Sep", TechVentures: 480, AgriGrowth: 290, FinServe: 380, EnergyPrime: 230, MediCare: 350 },
  { month: "Oct", TechVentures: 510, AgriGrowth: 320, FinServe: 390, EnergyPrime: 200, MediCare: 370 },
  { month: "Nov", TechVentures: 530, AgriGrowth: 300, FinServe: 410, EnergyPrime: 250, MediCare: 360 },
  { month: "Dec", TechVentures: 560, AgriGrowth: 340, FinServe: 420, EnergyPrime: 270, MediCare: 400 },
  { month: "Jan", TechVentures: 580, AgriGrowth: 350, FinServe: 430, EnergyPrime: 260, MediCare: 410 },
  { month: "Feb", TechVentures: 610, AgriGrowth: 330, FinServe: 450, EnergyPrime: 290, MediCare: 430 },
];

export const mockKPIData = [
  { subsidiary: "TechVentures", roace: 18.5, ebitda_margin: 32.4, revenue_growth: 12.3, liquidity: 2.1, debt_equity: 0.4 },
  { subsidiary: "AgriGrowth", roace: 12.1, ebitda_margin: 21.8, revenue_growth: 8.5, liquidity: 1.4, debt_equity: 0.9 },
  { subsidiary: "FinServe", roace: 22.3, ebitda_margin: 38.1, revenue_growth: 15.7, liquidity: 3.2, debt_equity: 0.3 },
  { subsidiary: "EnergyPrime", roace: 9.8, ebitda_margin: 18.2, revenue_growth: -2.1, liquidity: 0.8, debt_equity: 1.5 },
  { subsidiary: "MediCare", roace: 15.6, ebitda_margin: 27.5, revenue_growth: 10.1, liquidity: 1.9, debt_equity: 0.6 },
];

export const mockInsights: AIInsight[] = [
  { id: "1", type: "anomaly", severity: "high", title: "Unusual operating cost spike", description: "EnergyPrime shows a 30% increase in operating costs compared to its 6-month historical trend. This is significantly above the industry average increase of 5%.", subsidiary_id: "4", subsidiary_name: "EnergyPrime", created_at: "2026-03-07" },
  { id: "2", type: "opportunity", severity: "medium", title: "Revenue acceleration detected", description: "FinServe Holdings has shown consistent 5% month-over-month revenue growth for 4 consecutive months, outperforming sector peers by 3x.", subsidiary_id: "3", subsidiary_name: "FinServe Holdings", created_at: "2026-03-06" },
  { id: "3", type: "risk", severity: "critical", title: "Liquidity ratio below threshold", description: "EnergyPrime's liquidity ratio has dropped to 0.8, below the critical threshold of 1.0. Immediate attention required to avoid operational disruption.", subsidiary_id: "4", subsidiary_name: "EnergyPrime", created_at: "2026-03-06" },
  { id: "4", type: "trend", severity: "low", title: "Margin improvement trend", description: "TechVentures has improved EBITDA margin by 2.1% over the last quarter through operational efficiency gains.", subsidiary_id: "1", subsidiary_name: "TechVentures Ltd", created_at: "2026-03-05" },
  { id: "5", type: "alert", severity: "high", title: "Debt-to-equity ratio warning", description: "EnergyPrime's debt-to-equity ratio has risen to 1.5, indicating increased financial leverage and risk exposure.", subsidiary_id: "4", subsidiary_name: "EnergyPrime", created_at: "2026-03-04" },
];

export const mockRecommendations: CapitalRecommendation[] = [
  { id: "1", type: "internal_loan", title: "Internal liquidity transfer", description: "FinServe Holdings currently has excess cash reserves (liquidity ratio: 3.2) while EnergyPrime shows a critical liquidity shortage (0.8). Consider an internal loan of ₦150M at favorable terms.", amount: 150000000, currency: "NGN", from_subsidiary: "FinServe Holdings", to_subsidiary: "EnergyPrime", priority: "urgent", created_at: "2026-03-07" },
  { id: "2", type: "growth_investment", title: "Scale FinServe operations", description: "FinServe is outperforming all subsidiaries with 22.3% ROACE and 15.7% revenue growth. Allocate additional ₦200M growth capital to accelerate expansion into new markets.", amount: 200000000, currency: "NGN", to_subsidiary: "FinServe Holdings", priority: "high", created_at: "2026-03-06" },
  { id: "3", type: "cost_reduction", title: "EnergyPrime cost optimization", description: "Operating costs at EnergyPrime are 30% above trend. Initiate a cost audit and implement procurement optimization to target 15% reduction in operating expenses.", priority: "high", created_at: "2026-03-05" },
  { id: "4", type: "reallocation", title: "Portfolio rebalancing", description: "Consider reducing capital allocation to EnergyPrime (-₦50M) and redirecting to TechVentures (+₦50M) based on comparative ROACE and growth metrics.", amount: 50000000, currency: "NGN", from_subsidiary: "EnergyPrime", to_subsidiary: "TechVentures Ltd", priority: "medium", created_at: "2026-03-04" },
];

export const mockNormalizedData: NormalizedData[] = mockSubsidiaries.flatMap((sub) =>
  Array.from({ length: 8 }, (_, i) => ({
    subsidiary_id: sub.id,
    date: `2025-${String(7 + i).padStart(2, "0")}-01`,
    revenue: Math.round(200 + Math.random() * 400),
    expenses: Math.round(120 + Math.random() * 250),
    net_income: Math.round(50 + Math.random() * 150),
    cash: Math.round(100 + Math.random() * 300),
    debt: Math.round(50 + Math.random() * 200),
    assets: Math.round(500 + Math.random() * 500),
    liabilities: Math.round(200 + Math.random() * 300),
    equity: Math.round(300 + Math.random() * 300),
    operating_costs: Math.round(80 + Math.random() * 180),
  }))
);
