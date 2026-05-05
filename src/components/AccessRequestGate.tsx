import { useState, ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Send, Clock, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessRequests, AccessModule } from "@/contexts/AccessRequestContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

interface Props {
  module: AccessModule;
  moduleLabel: string;
  children: ReactNode;
}

export default function AccessRequestGate({ module, moduleLabel, children }: Props) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { hasGrant, pendingFor, submitRequest, cancel } = useAccessRequests();
  const [reason, setReason] = useState("");

  // Admin & MD/CEO: full access via roles, never gated.
  if (role !== "analyst") return <>{children}</>;
  if (user && hasGrant(user.email, module)) return <>{children}</>;

  const pending = user ? pendingFor(user.email, module) : undefined;

  const handleSubmit = () => {
    if (!user) return;
    submitRequest(user.email, user.name, module, reason || "(no reason provided)");
    toast.success("Access request submitted", {
      description: `Your MD/CEO or Admin will review your request for ${moduleLabel}.`,
    });
    setReason("");
  };

  const handleCancel = () => {
    if (!user || !pending) return;
    cancel(pending.id, user.email);
    toast.success("Request cancelled", {
      description: `Your pending request for ${moduleLabel} has been withdrawn.`,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-warning/30">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <CardTitle className="text-xl">{moduleLabel} is restricted</CardTitle>
                <CardDescription>Analysts need approval from an MD/CEO or Admin to access this module.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {pending ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">Request pending review</p>
                    <Badge variant="secondary" className="text-xs">Pending</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted {new Date(pending.created_at).toLocaleString()}. You'll gain access as soon as it's approved.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">"{pending.reason}"</p>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                      <X className="w-4 h-4" /> Cancel request
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-info shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Tell your MD/CEO or Admin why you need access to <span className="font-medium text-foreground">{moduleLabel}</span>.
                    Once approved, this module will unlock for your account.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for access (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder={`E.g. I need to model Q3 reallocation across FinServe and EnergyPrime…`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmit} className="gap-2">
                  <Send className="w-4 h-4" /> Request access
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
