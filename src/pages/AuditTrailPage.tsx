import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search, Briefcase, FileText, ShieldCheck, Settings, ArrowUpRight, Activity } from "lucide-react";
import { useAuditLogs } from "@/hooks/useApi";

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
  const { data: fetchedLogs = [] } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredLogs = fetchedLogs.filter((log: any) => {
    const target = log.target || "";
    const user = log.user || "";
    const details = log.details || "";
    const matchesSearch = target.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
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

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search actions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                {filteredLogs.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{entry.user}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${actionColors[entry.action] || actionColors.modified}`}>
                        {entry.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{entry.target}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-xs truncate">{entry.details}</TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
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
