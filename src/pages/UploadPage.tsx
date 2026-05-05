import { useState, useCallback, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { mockSubsidiaries } from "@/data/mockData";
import type { ReportType, ReportingPeriod, ColumnMapping } from "@/types";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, ShieldAlert, Sparkles, Save, RotateCcw, Building2, X, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";
import { autoMapColumns, findTemplate, saveTemplate } from "@/lib/columnMapper";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "income_statement", label: "Income Statement" },
  { value: "balance_sheet", label: "Balance Sheet" },
  { value: "cash_flow", label: "Cash Flow Statement" },
  { value: "operational_metrics", label: "Operational Metrics" },
];

const periods: { value: ReportingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const standardFields = ["revenue", "expenses", "net_income", "cash", "debt", "assets", "liabilities", "equity", "operating_costs", "ebitda", "capex", "operating_cashflow"];

const simulatedColumns = ["Revenue (₦)", "Operating Costs", "Net Profit", "Total Assets", "Current Liabilities", "Shareholder Equity"];

// Simulated row data for validation
const simulatedRows: Record<string, string>[] = [
  { "Revenue (₦)": "5200000", "Operating Costs": "3100000", "Net Profit": "1400000", "Total Assets": "12000000", "Current Liabilities": "2300000", "Shareholder Equity": "8500000" },
  { "Revenue (₦)": "4800000", "Operating Costs": "", "Net Profit": "abc", "Total Assets": "11500000", "Current Liabilities": "2100000", "Shareholder Equity": "8200000" },
  { "Revenue (₦)": "", "Operating Costs": "2900000", "Net Profit": "1350000", "Total Assets": "-500", "Current Liabilities": "2050000", "Shareholder Equity": "" },
  { "Revenue (₦)": "5500000", "Operating Costs": "3300000", "Net Profit": "1500000", "Total Assets": "12500000", "Current Liabilities": "N/A", "Shareholder Equity": "9000000" },
  { "Revenue (₦)": "5100000", "Operating Costs": "3050000", "Net Profit": "1420000", "Total Assets": "12200000", "Current Liabilities": "2250000", "Shareholder Equity": "8600000" },
];

const requiredFields = ["revenue", "expenses", "net_income", "assets", "liabilities", "equity"];

interface ValidationIssue {
  type: "missing_field" | "empty_value" | "invalid_type" | "negative_value" | "unmapped_required";
  severity: "error" | "warning";
  field: string;
  row?: number;
  message: string;
}

function runValidation(mappings: ColumnMapping[], rows: Record<string, string>[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const mappedFields = new Set(mappings.filter(m => m.target_field && m.target_field !== "skip").map(m => m.target_field));
  const fieldToSource = new Map(mappings.filter(m => m.target_field && m.target_field !== "skip").map(m => [m.target_field, m.source_column]));

  // Check unmapped required fields
  for (const req of requiredFields) {
    if (!mappedFields.has(req)) {
      issues.push({ type: "unmapped_required", severity: "error", field: req, message: `Required field "${req}" is not mapped to any column.` });
    }
  }

  // Check row-level data issues
  for (let i = 0; i < rows.length; i++) {
    for (const [targetField, sourceCol] of fieldToSource) {
      const val = rows[i][sourceCol];

      if (val === undefined || val === null || val.toString().trim() === "") {
        issues.push({ type: "empty_value", severity: requiredFields.includes(targetField) ? "error" : "warning", field: targetField, row: i + 1, message: `Empty value for "${targetField}" in row ${i + 1}.` });
        continue;
      }

      const trimmed = val.toString().trim();
      if (["n/a", "na", "-", "null", "none", "#n/a"].includes(trimmed.toLowerCase())) {
        issues.push({ type: "invalid_type", severity: "warning", field: targetField, row: i + 1, message: `Non-numeric placeholder "${trimmed}" for "${targetField}" in row ${i + 1}.` });
        continue;
      }

      const num = Number(trimmed.replace(/,/g, ""));
      if (isNaN(num)) {
        issues.push({ type: "invalid_type", severity: "error", field: targetField, row: i + 1, message: `"${trimmed}" is not a valid number for "${targetField}" in row ${i + 1}.` });
      } else if (num < 0 && ["revenue", "assets", "equity"].includes(targetField)) {
        issues.push({ type: "negative_value", severity: "warning", field: targetField, row: i + 1, message: `Negative value (${num}) for "${targetField}" in row ${i + 1} — please verify.` });
      }
    }
  }

  return issues;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence === 0) return null;
  const color = confidence >= 0.8 ? "bg-green-500/15 text-green-700 dark:text-green-400" : confidence >= 0.6 ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" : "bg-orange-500/15 text-orange-700 dark:text-orange-400";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>
          {Math.round(confidence * 100)}%
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {confidence >= 0.8 ? "High confidence match" : confidence >= 0.6 ? "Medium confidence — please verify" : "Low confidence — review carefully"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

type UploadMode = "single" | "bulk";

interface BulkFileEntry {
  subsidiaryId: string;
  file: File | null;
}

export default function UploadPage() {
  const { hasPermission } = usePermissions();
  const canUpload = hasPermission("upload_reports");

  const [step, setStep] = useState(1);
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");

  // Single mode state
  const [subsidiaryId, setSubsidiaryId] = useState("");

  // Bulk mode state
  const [selectedSubsidiaryIds, setSelectedSubsidiaryIds] = useState<string[]>([]);
  const [bulkFiles, setBulkFiles] = useState<BulkFileEntry[]>([]);

  // Shared state
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [period, setPeriod] = useState<ReportingPeriod | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mappings, setMappings] = useState<ColumnMapping[]>(
    simulatedColumns.map(col => ({ source_column: col, target_field: "" }))
  );
  const [confidences, setConfidences] = useState<Record<string, number>>({});
  const [usedTemplate, setUsedTemplate] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationRun, setValidationRun] = useState(false);

  // Sync bulk files when subsidiaries change
  useEffect(() => {
    if (uploadMode === "bulk") {
      setBulkFiles(selectedSubsidiaryIds.map(id => ({
        subsidiaryId: id,
        file: bulkFiles.find(bf => bf.subsidiaryId === id)?.file || null,
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubsidiaryIds, uploadMode]);

  const stepLabels = uploadMode === "bulk"
    ? ["Subsidiaries", "Report Type", "Period", "Upload Files", "Map Columns", "Validate"]
    : ["Subsidiary", "Report Type", "Period", "Upload File", "Map Columns", "Validate"];

  // Auto-map when entering step 5
  useEffect(() => {
    if (step === 5 && !usedTemplate) {
      const primarySubId = uploadMode === "single" ? subsidiaryId : selectedSubsidiaryIds[0];
      if (primarySubId && reportType) {
        const template = findTemplate(primarySubId, reportType);
        if (template) {
          const restored = simulatedColumns.map(col => ({
            source_column: col,
            target_field: template.mappings[col] || "",
          }));
          setMappings(restored);
          setUsedTemplate(true);
          setConfidences({});
          toast.success("Previous mapping template loaded!", { icon: <Save className="w-4 h-4" /> });
          return;
        }
      }

      const suggestions = autoMapColumns(simulatedColumns);
      const newMappings = suggestions.map(s => ({
        source_column: s.sourceColumn,
        target_field: s.suggestedField,
      }));
      const newConfidences: Record<string, number> = {};
      suggestions.forEach(s => {
        if (s.confidence > 0) newConfidences[s.sourceColumn] = s.confidence;
      });
      setMappings(newMappings);
      setConfidences(newConfidences);

      const matched = suggestions.filter(s => s.suggestedField).length;
      if (matched > 0) {
        toast.success(`Auto-mapped ${matched} of ${simulatedColumns.length} columns.`, { icon: <Sparkles className="w-4 h-4" /> });
      }
    }
  }, [step, subsidiaryId, selectedSubsidiaryIds, reportType, usedTemplate, uploadMode]);

  // Run validation when entering step 6
  useEffect(() => {
    if (step === 6 && !validationRun) {
      const issues = runValidation(mappings, simulatedRows);
      setValidationIssues(issues);
      setValidationRun(true);
      const errors = issues.filter(i => i.severity === "error").length;
      const warnings = issues.filter(i => i.severity === "warning").length;
      if (errors === 0 && warnings === 0) {
        toast.success("All validations passed!");
      } else if (errors > 0) {
        toast.error(`${errors} error(s) and ${warnings} warning(s) found.`);
      } else {
        toast.warning(`${warnings} warning(s) found — review before submitting.`);
      }
    }
  }, [step, mappings, validationRun]);

  const canProceed = () => {
    if (step === 1) {
      return uploadMode === "single" ? !!subsidiaryId : selectedSubsidiaryIds.length >= 2;
    }
    if (step === 2) return !!reportType;
    if (step === 3) return !!period;
    if (step === 4) {
      if (uploadMode === "single") return !!file;
      return bulkFiles.every(bf => bf.file !== null);
    }
    if (step === 5) return mappings.some(m => m.target_field && m.target_field !== "skip");
    if (step === 6) {
      const errors = validationIssues.filter(i => i.severity === "error").length;
      return errors === 0;
    }
    return false;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
    } else {
      toast.error("Please upload a CSV or Excel file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleBulkFileSelect = (subsidiaryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setBulkFiles(prev => prev.map(bf =>
        bf.subsidiaryId === subsidiaryId ? { ...bf, file: f } : bf
      ));
    }
  };

  const toggleSubsidiary = (id: string) => {
    setSelectedSubsidiaryIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAllSubsidiaries = () => {
    if (selectedSubsidiaryIds.length === mockSubsidiaries.length) {
      setSelectedSubsidiaryIds([]);
    } else {
      setSelectedSubsidiaryIds(mockSubsidiaries.map(s => s.id));
    }
  };

  const updateMapping = (index: number, target: string) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, target_field: target } : m));
    setConfidences(prev => {
      const next = { ...prev };
      delete next[mappings[index].source_column];
      return next;
    });
  };

  const resetAutoMap = () => {
    const suggestions = autoMapColumns(simulatedColumns);
    const newMappings = suggestions.map(s => ({
      source_column: s.sourceColumn,
      target_field: s.suggestedField,
    }));
    const newConfidences: Record<string, number> = {};
    suggestions.forEach(s => {
      if (s.confidence > 0) newConfidences[s.sourceColumn] = s.confidence;
    });
    setMappings(newMappings);
    setConfidences(newConfidences);
    setUsedTemplate(false);
    toast.info("Auto-mapping re-applied");
  };

  const handleSubmit = () => {
    const subIds = uploadMode === "single" ? [subsidiaryId] : selectedSubsidiaryIds;
    const mappingRecord: Record<string, string> = {};
    mappings.forEach(m => { mappingRecord[m.source_column] = m.target_field; });

    subIds.forEach(id => {
      if (reportType) {
        saveTemplate({ subsidiaryId: id, reportType, mappings: mappingRecord, lastUsed: new Date().toISOString() });
      }
    });

    const count = subIds.length;
    toast.success(
      count === 1
        ? "Report uploaded and mapped successfully! Data normalization in progress."
        : `${count} reports uploaded and mapped successfully! Batch normalization in progress.`
    );

    setValidationIssues([]);
    setValidationRun(false);

    // Reset
    setStep(1);
    setSubsidiaryId("");
    setSelectedSubsidiaryIds([]);
    setBulkFiles([]);
    setReportType("");
    setPeriod("");
    setFile(null);
    setMappings(simulatedColumns.map(col => ({ source_column: col, target_field: "" })));
    setConfidences({});
    setUsedTemplate(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Financial Report</h1>
          <p className="text-muted-foreground mt-1">Ingest and map financial data from your subsidiaries</p>
        </div>

        {!canUpload && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm">You don't have permission to upload reports. Contact your admin for access.</p>
          </div>
        )}

        {/* Upload Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={uploadMode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => { setUploadMode("single"); setStep(1); setSelectedSubsidiaryIds([]); setBulkFiles([]); }}
          >
            <Upload className="w-4 h-4 mr-1.5" /> Single Upload
          </Button>
          <Button
            variant={uploadMode === "bulk" ? "default" : "outline"}
            size="sm"
            onClick={() => { setUploadMode("bulk"); setStep(1); setSubsidiaryId(""); setFile(null); }}
          >
            <Building2 className="w-4 h-4 mr-1.5" /> Bulk Upload
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
              {i < 5 && <div className={`w-8 h-px ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="glass-card">
          <CardContent className="p-6">
            {/* Step 1: Subsidiary Selection */}
            {step === 1 && uploadMode === "single" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Select Subsidiary</Label>
                <Select value={subsidiaryId} onValueChange={setSubsidiaryId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choose a subsidiary" /></SelectTrigger>
                  <SelectContent>
                    {mockSubsidiaries.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {s.country}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 1 && uploadMode === "bulk" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Select Subsidiaries</Label>
                  <Button variant="ghost" size="sm" onClick={selectAllSubsidiaries} className="text-xs">
                    {selectedSubsidiaryIds.length === mockSubsidiaries.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Choose 2 or more subsidiaries for bulk upload.</p>
                <div className="space-y-2">
                  {mockSubsidiaries.map(s => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSubsidiaryIds.includes(s.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedSubsidiaryIds.includes(s.id)}
                        onCheckedChange={() => toggleSubsidiary(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.industry} · {s.country}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{s.currency}</Badge>
                    </label>
                  ))}
                </div>
                {selectedSubsidiaryIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedSubsidiaryIds.length} of {mockSubsidiaries.length} subsidiaries selected
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Report Type */}
            {step === 2 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Report Type</Label>
                {uploadMode === "bulk" && (
                  <p className="text-sm text-muted-foreground">This report type will apply to all {selectedSubsidiaryIds.length} selected subsidiaries.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {reportTypes.map(rt => (
                    <button
                      key={rt.value}
                      onClick={() => setReportType(rt.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${reportType === rt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <FileSpreadsheet className={`w-5 h-5 mb-2 ${reportType === rt.value ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-medium">{rt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Period */}
            {step === 3 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Reporting Period</Label>
                <div className="grid grid-cols-3 gap-3">
                  {periods.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className={`p-4 rounded-lg border text-center transition-all ${period === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <p className="text-sm font-medium">{p.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: File Upload */}
            {step === 4 && uploadMode === "single" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Upload File</Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                  {file ? (
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-1">CSV, XLS, XLSX supported</p>
                    </div>
                  )}
                  <input id="file-input" type="file" accept=".csv,.xls,.xlsx" onChange={handleFileSelect} className="hidden" />
                </div>
              </div>
            )}

            {step === 4 && uploadMode === "bulk" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Upload Files for Each Subsidiary</Label>
                <p className="text-sm text-muted-foreground">Attach a file for each selected subsidiary. All files should share the same column structure.</p>
                <div className="space-y-3">
                  {bulkFiles.map(bf => {
                    const sub = mockSubsidiaries.find(s => s.id === bf.subsidiaryId);
                    return (
                      <div key={bf.subsidiaryId} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{sub?.name}</p>
                          {bf.file ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-muted-foreground truncate">{bf.file.name}</span>
                              <button
                                onClick={() => setBulkFiles(prev => prev.map(b => b.subsidiaryId === bf.subsidiaryId ? { ...b, file: null } : b))}
                                className="text-muted-foreground hover:text-destructive ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No file selected</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`bulk-file-${bf.subsidiaryId}`)?.click()}
                          className="shrink-0 text-xs"
                        >
                          {bf.file ? "Replace" : "Choose File"}
                        </Button>
                        <input
                          id={`bulk-file-${bf.subsidiaryId}`}
                          type="file"
                          accept=".csv,.xls,.xlsx"
                          onChange={(e) => handleBulkFileSelect(bf.subsidiaryId, e)}
                          className="hidden"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {bulkFiles.filter(bf => bf.file).length} of {bulkFiles.length} files attached
                </p>
              </div>
            )}

            {/* Step 5: Column Mapping */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Smart Column Mapping</Label>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetAutoMap} className="text-xs gap-1.5">
                    <RotateCcw className="w-3 h-3" /> Re-run Auto-Map
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Columns have been auto-matched to standard fields using intelligent name recognition.
                  {usedTemplate && <span className="text-primary font-medium"> (Loaded from saved template)</span>}
                  {uploadMode === "bulk" && <span className="font-medium"> This mapping applies to all {selectedSubsidiaryIds.length} subsidiaries.</span>}
                  {" "}Review and adjust as needed.
                </p>

                {Object.keys(confidences).length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-1">
                    <p className="font-medium text-foreground">Auto-mapping summary:</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const high = Object.values(confidences).filter(c => c >= 0.8).length;
                        const med = Object.values(confidences).filter(c => c >= 0.6 && c < 0.8).length;
                        const low = Object.values(confidences).filter(c => c > 0 && c < 0.6).length;
                        const unmapped = mappings.filter(m => !m.target_field).length;
                        return (
                          <>
                            {high > 0 && <span className="text-green-700 dark:text-green-400">✓ {high} high confidence</span>}
                            {med > 0 && <span className="text-yellow-700 dark:text-yellow-400">⚠ {med} medium confidence</span>}
                            {low > 0 && <span className="text-orange-700 dark:text-orange-400">⚡ {low} low confidence</span>}
                            {unmapped > 0 && <span className="text-muted-foreground">○ {unmapped} unmatched</span>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="space-y-3 mt-4">
                  {mappings.map((mapping, i) => (
                    <div key={mapping.source_column} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant="outline" className="shrink-0 font-mono text-xs">{mapping.source_column}</Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <ConfidenceBadge confidence={confidences[mapping.source_column] || 0} />
                      </div>
                      <Select value={mapping.target_field} onValueChange={v => updateMapping(i, v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select field" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">— Skip —</SelectItem>
                          {standardFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Data Validation */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Data Validation</Label>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setValidationRun(false); }} className="text-xs gap-1.5">
                    <RotateCcw className="w-3 h-3" /> Re-run Validation
                  </Button>
                </div>

                {(() => {
                  const errors = validationIssues.filter(i => i.severity === "error");
                  const warnings = validationIssues.filter(i => i.severity === "warning");
                  const totalChecked = mappings.filter(m => m.target_field && m.target_field !== "skip").length * simulatedRows.length + requiredFields.length;
                  const passRate = totalChecked > 0 ? Math.round(((totalChecked - errors.length - warnings.length) / totalChecked) * 100) : 100;

                  return (
                    <>
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                          <XCircle className={`w-5 h-5 mx-auto mb-1 ${errors.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                          <p className="text-lg font-bold">{errors.length}</p>
                          <p className="text-xs text-muted-foreground">Errors</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                          <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${warnings.length > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`} />
                          <p className="text-lg font-bold">{warnings.length}</p>
                          <p className="text-xs text-muted-foreground">Warnings</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-lg font-bold">{passRate}%</p>
                          <p className="text-xs text-muted-foreground">Pass Rate</p>
                        </div>
                      </div>

                      <Progress value={passRate} className="h-2" />

                      {errors.length === 0 && warnings.length === 0 && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <AlertTitle>All checks passed</AlertTitle>
                          <AlertDescription>Your data is clean and ready for submission.</AlertDescription>
                        </Alert>
                      )}

                      {errors.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Errors — must fix before submitting
                          </p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {errors.map((issue, i) => (
                              <div key={`err-${i}`} className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-xs">
                                <XCircle className="w-3 h-3 mt-0.5 text-destructive shrink-0" />
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {warnings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> Warnings — review recommended
                          </p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {warnings.map((issue, i) => (
                              <div key={`warn-${i}`} className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 text-xs">
                                <AlertTriangle className="w-3 h-3 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {errors.length > 0 && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Go back to fix column mappings or correct the source data to resolve errors. Warnings can be submitted but may affect data accuracy.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => { if (step === 6) setValidationRun(false); setStep(s => s - 1); }} disabled={step === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              {step < 6 ? (
                <PermissionTooltip hasPermission={canUpload} message="You need upload permissions to proceed.">
                  <Button onClick={() => setStep(s => s + 1)} disabled={!canUpload || !canProceed()}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </PermissionTooltip>
              ) : (
                <PermissionTooltip hasPermission={canUpload} message="You need upload permissions to submit reports.">
                  <Button onClick={handleSubmit} disabled={!canUpload || !canProceed()}>
                    <Check className="w-4 h-4 mr-2" />
                    {uploadMode === "bulk" ? `Submit ${selectedSubsidiaryIds.length} Reports` : "Submit & Normalize"}
                  </Button>
                </PermissionTooltip>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
