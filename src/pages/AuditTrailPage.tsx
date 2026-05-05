import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "approved" | "rejected" | "deferred" | "assigned" | "uploaded" | "created" | "modified" | "exported";
  target: string;
  details: string;
  category: "capital" | "report" | "subsidiary" | "settings" | "export";
}

const mockAuditLog: AuditEntry[] = [
  { id: "1", timestamp: "2026-03-10T09:30:00", user: "Admin", action: "approved", target: "Internal liquidity transfer", details: "Approved ₦150M transfer from FinServe to EnergyPrime", category: "capital" },
  { id: "2", timestamp: "2026-03-09T16:15:00", user: "Admin", action: "assigned", target: "EnergyPrime cost optimization", details: "Assigned to CFO for review", category: "capital" },
  { id: "3", timestamp: "2026-03-09T14:00:00", user: "Admin", action: "exported", target: "Q4 2025 Board Report", details: "Generated board report with 5 sections", category: "export" },
  { id: "4", timestamp: "2026-03-08T11:45:00", user: "Admin", action: "rejected", target: "Portfolio rebalancing", details: "Rejected capital reallocation from EnergyPrime to TechVentures", category: "capital" },
  { id: "5", timestamp: "2026-03-08T10:00:00", user: "Admin", action: "uploaded", target: "TechVentures Q4 Report", details: "Uploaded income statement for Q4 2025", category: "report" },
  { id: "6", timestamp: "2026-03-07T15:30:00", user: "Admin", action: "deferred", target: "Scale FinServe operations", details: "Deferred ₦200M growth investment to next quarter", category: "capital" },
  { id: "7", timestamp: "2026-03-07T09:00:00", user: "Admin", action: "created", target: "MediCare Group", details: "Added new subsidiary to portfolio", category: "subsidiary" },
  { id: "8", timestamp: "2026-03-06T14:20:00", user: "Admin", action: "modified", target: "Alert Rules", details: "Updated liquidity ratio threshold from 1.2 to 1.0", category: "settings" },
];

const actionColors: Record<string, string> = {
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  deferred: "bg-warning/10 text-warning border-warning/20",
  assigned: "bg-info/10 text-info border-info/20",
  uploaded: "bg-primary/10 text-primary border-primary/20",
  created: "bg-primary/10 text-primary border-primary/20",
  modified: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
  exported: "bg-info/10 text-info border-info/20",
};

export default function AuditTrailPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = mockAuditLog.filter((entry) => {
    if (filter !== "all" && entry.category !== filter) return false;
    if (search && !entry.target.toLowerCase().includes(search.toLowerCase()) && !entry.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6" /> Audit Trail
          </h1>
          <p className="text-muted-foreground">Complete log of all decisions, actions, and changes across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Actions", value: mockAuditLog.length },
            { label: "Capital Decisions", value: mockAuditLog.filter((e) => e.category === "capital").length },
            { label: "Reports", value: mockAuditLog.filter((e) => e.category === "report" || e.category === "export").length },
            { label: "This Week", value: mockAuditLog.filter((e) => new Date(e.timestamp) > new Date("2026-03-04")).length },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="capital">Capital Decisions</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="subsidiary">Subsidiaries</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="export">Exports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{entry.user}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${actionColors[entry.action]}`}>
                        {entry.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{entry.target}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-xs truncate">{entry.details}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No matching audit entries found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
