import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockRecommendations } from "@/data/mockData";
import type { CapitalRecommendation } from "@/types";
import { Wallet, ArrowRightLeft, TrendingUp, AlertTriangle, Scissors, DollarSign, Check, X, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";

const typeIcons: Record<string, typeof Wallet> = {
  reallocation: ArrowRightLeft,
  internal_loan: DollarSign,
  cost_reduction: Scissors,
  growth_investment: TrendingUp,
  risk_alert: AlertTriangle,
};

const priorityColors: Record<string, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  urgent: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground border-border", icon: Clock },
  approved: { label: "Approved", color: "bg-success/10 text-success border-success/20", icon: Check },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
  deferred: { label: "Deferred", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
};

const typeLabels: Record<string, string> = {
  reallocation: "Reallocation",
  internal_loan: "Internal Loan",
  cost_reduction: "Cost Reduction",
  growth_investment: "Growth Investment",
  risk_alert: "Risk Alert",
};

function formatCurrency(amount: number, currency: string = "NGN") {
  if (amount >= 1e9) return `${currency === "NGN" ? "₦" : "$"}${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `${currency === "NGN" ? "₦" : "$"}${(amount / 1e6).toFixed(0)}M`;
  return `${currency === "NGN" ? "₦" : "$"}${amount.toLocaleString()}`;
}

const teamMembers = ["Adebayo Ogunlesi", "Funke Adeyemi", "Chidi Nwosu", "Ngozi Eze"];

export default function CapitalPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("manage_capital");
  const [recommendations, setRecommendations] = useState<CapitalRecommendation[]>(
    mockRecommendations.map((r) => ({ ...r, status: r.status || "pending" }))
  );
  const [assignDialog, setAssignDialog] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const updateStatus = (id: string, status: "approved" | "rejected" | "deferred") => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, decided_at: new Date().toISOString(), decided_by: "Current User" } : r
      )
    );
    toast.success(`Recommendation ${status}`);
  };

  const handleAssign = () => {
    if (!assignDialog || !assignee) return;
    setRecommendations((prev) =>
      prev.map((r) => (r.id === assignDialog ? { ...r, assigned_to: assignee, notes: notes || r.notes } : r))
    );
    toast.success(`Assigned to ${assignee}`);
    setAssignDialog(null);
    setAssignee("");
    setNotes("");
  };

  const filtered = filter === "all" ? recommendations : recommendations.filter((r) => r.status === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Capital Allocation</h1>
              <p className="text-muted-foreground mt-1">Review and act on AI-generated recommendations</p>
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected", "deferred"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize text-xs"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((rec, i) => {
            const Icon = typeIcons[rec.type] || Wallet;
            const status = statusConfig[rec.status || "pending"];
            const StatusIcon = status.icon;
            return (
              <Card key={rec.id} className="glass-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{rec.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{typeLabels[rec.type]}</Badge>
                            <Badge variant="outline" className={`text-xs ${priorityColors[rec.priority]}`}>{rec.priority}</Badge>
                            <Badge variant="outline" className={`text-xs ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                            </Badge>
                            {rec.assigned_to && (
                              <Badge variant="secondary" className="text-xs">
                                <UserPlus className="w-3 h-3 mr-1" />{rec.assigned_to}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {rec.amount && (
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-primary">{formatCurrency(rec.amount, rec.currency)}</p>
                            <p className="text-xs text-muted-foreground">recommended</p>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{rec.description}</p>

                      {(rec.from_subsidiary || rec.to_subsidiary) && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm mb-3">
                          {rec.from_subsidiary && <span className="font-medium">{rec.from_subsidiary}</span>}
                          {rec.from_subsidiary && rec.to_subsidiary && <ArrowRightLeft className="w-4 h-4 text-primary shrink-0" />}
                          {rec.to_subsidiary && <span className="font-medium">{rec.to_subsidiary}</span>}
                        </div>
                      )}

                      {rec.notes && (
                        <p className="text-xs text-muted-foreground italic mb-3">Note: {rec.notes}</p>
                      )}

                      {/* Action Buttons */}
                      {rec.status === "pending" && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <PermissionTooltip hasPermission={canManage} message="Only admins can approve capital recommendations.">
                            <Button size="sm" onClick={() => updateStatus(rec.id, "approved")} disabled={!canManage} className="bg-success hover:bg-success/90 text-success-foreground">
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                          </PermissionTooltip>
                          <PermissionTooltip hasPermission={canManage} message="Only admins can reject capital recommendations.">
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(rec.id, "rejected")} disabled={!canManage}>
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </PermissionTooltip>
                          <PermissionTooltip hasPermission={canManage} message="Only admins can defer capital recommendations.">
                            <Button size="sm" variant="outline" onClick={() => updateStatus(rec.id, "deferred")} disabled={!canManage}>
                              <Clock className="w-3.5 h-3.5 mr-1" /> Defer
                            </Button>
                          </PermissionTooltip>
                          <PermissionTooltip hasPermission={canManage} message="Only admins can assign recommendations.">
                            <Button size="sm" variant="outline" onClick={() => setAssignDialog(rec.id)} disabled={!canManage}>
                              <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign
                            </Button>
                          </PermissionTooltip>
                        </div>
                      )}
                      {rec.status !== "pending" && rec.decided_at && (
                        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                          {rec.status} by {rec.decided_by} on {new Date(rec.decided_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No recommendations match this filter.</div>
          )}
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => !open && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Recommendation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context or instructions..." />
            </div>
            <Button onClick={handleAssign} disabled={!assignee} className="w-full">Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
