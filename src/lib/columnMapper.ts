/**
 * Smart column auto-mapping utility.
 * Fuzzy-matches uploaded column names to standard financial fields
 * and returns suggestions with confidence scores.
 */

export interface MappingSuggestion {
  sourceColumn: string;
  suggestedField: string;
  confidence: number; // 0-1
}

const synonymMap: Record<string, string[]> = {
  revenue: ["revenue", "sales", "turnover", "income", "total revenue", "gross revenue", "net sales", "total sales", "rev"],
  expenses: ["expenses", "total expenses", "operating expenses", "opex", "cost", "costs", "total costs", "expenditure"],
  net_income: ["net income", "net profit", "profit", "net earnings", "bottom line", "pat", "profit after tax", "net profit/loss", "pbt", "profit before tax"],
  cash: ["cash", "cash balance", "cash at hand", "cash and equivalents", "cash & equivalents", "cash on hand", "liquid assets"],
  debt: ["debt", "total debt", "borrowings", "loans", "total borrowings", "long term debt", "short term debt", "indebtedness"],
  assets: ["assets", "total assets", "gross assets", "net assets", "asset base"],
  liabilities: ["liabilities", "total liabilities", "current liabilities", "non-current liabilities", "obligations"],
  equity: ["equity", "shareholder equity", "shareholders equity", "shareholders' equity", "stockholders equity", "net worth", "owner's equity", "total equity", "book value"],
  operating_costs: ["operating costs", "operating cost", "cost of operations", "operational costs", "opex", "overhead", "overheads", "cogs", "cost of goods sold", "cost of sales"],
  ebitda: ["ebitda", "earnings before interest", "operating profit", "operating income", "ebit"],
  capex: ["capex", "capital expenditure", "capital expenditures", "capital spending", "cap ex", "fixed asset additions"],
  operating_cashflow: ["operating cashflow", "operating cash flow", "cash from operations", "cfo", "ocf", "net cash from operating", "cash flow from operations"],
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[₦$€£¥#%()]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  // Levenshtein-based similarity for short strings
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(" ").filter(w => w.length > 1));
  const wordsB = new Set(b.split(" ").filter(w => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let matches = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) matches++; });
  return matches / Math.max(wordsA.size, wordsB.size);
}

export function autoMapColumns(sourceColumns: string[]): MappingSuggestion[] {
  return sourceColumns.map(col => {
    const normalizedCol = normalize(col);
    let bestField = "";
    let bestScore = 0;

    for (const [field, synonyms] of Object.entries(synonymMap)) {
      for (const synonym of synonyms) {
        const sim = Math.max(
          similarity(normalizedCol, synonym),
          wordOverlap(normalizedCol, synonym)
        );
        if (sim > bestScore) {
          bestScore = sim;
          bestField = field;
        }
      }
    }

    return {
      sourceColumn: col,
      suggestedField: bestScore >= 0.5 ? bestField : "",
      confidence: Math.round(bestScore * 100) / 100,
    };
  });
}

// Saved mapping templates per subsidiary (localStorage)
const STORAGE_KEY = "column-mapping-templates";

export interface MappingTemplate {
  subsidiaryId: string;
  reportType: string;
  mappings: Record<string, string>; // sourceColumn -> targetField
  lastUsed: string;
}

export function getSavedTemplates(): MappingTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTemplate(template: MappingTemplate) {
  const templates = getSavedTemplates().filter(
    t => !(t.subsidiaryId === template.subsidiaryId && t.reportType === template.reportType)
  );
  templates.push({ ...template, lastUsed: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function findTemplate(subsidiaryId: string, reportType: string): MappingTemplate | null {
  return getSavedTemplates().find(
    t => t.subsidiaryId === subsidiaryId && t.reportType === reportType
  ) || null;
}
