import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, FileSpreadsheet, Database, Cloud, CheckCircle2, Server } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";

const integrations = [
  {
    id: "sap",
    name: "SAP S/4HANA",
    description: "Direct API connection for enterprise financials.",
    icon: Database,
    status: "available",
    type: "erp"
  },
  {
    id: "oracle",
    name: "Oracle NetSuite",
    description: "Sync accounting data directly from NetSuite.",
    icon: Cloud,
    status: "available",
    type: "erp"
  },
  {
    id: "dynamics",
    name: "Microsoft Dynamics 365",
    description: "Automated ledger and trial balance sync.",
    icon: Server,
    status: "coming_soon",
    type: "erp"
  },
  {
    id: "csv",
    name: "CSV / Excel Upload",
    description: "Manual upload for legacy systems or smaller entities.",
    icon: FileSpreadsheet,
    status: "connected",
    type: "file"
  }
];

export default function IntegrationsPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("manage_settings"); // or true for now

  const [connected, setConnected] = useState<string[]>(["csv"]);

  const handleConnect = (id: string) => {
    if (id === "dynamics") {
      toast.info("Microsoft Dynamics integration is coming soon!");
      return;
    }
    
    if (connected.includes(id)) {
      setConnected(connected.filter(c => c !== id));
      toast.success("Integration disconnected successfully.");
    } else {
      toast.loading("Authenticating with provider...");
      setTimeout(() => {
        setConnected([...connected, id]);
        toast.dismiss();
        toast.success("Successfully connected to integration.");
      }, 1500);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plug className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Integrations Hub</h1>
              <p className="text-muted-foreground mt-1">Connect enterprise data sources or upload manually.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, i) => {
            const Icon = integration.icon;
            const isConnected = connected.includes(integration.id);
            
            return (
              <Card key={integration.id} className={`glass-card animate-fade-up ${isConnected ? 'border-primary/50 bg-primary/5' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    {isConnected && (
                      <Badge variant="default" className="bg-success text-success-foreground hover:bg-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    )}
                    {!isConnected && integration.status === "coming_soon" && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4">{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {integration.id === "csv" ? (
                    <div className="flex gap-2">
                      <Link to="/upload" className="w-full">
                        <Button className="w-full" variant="outline">Go to Upload Portal</Button>
                      </Link>
                    </div>
                  ) : (
                    <PermissionTooltip hasPermission={canManage} message="Only admins can manage integrations.">
                      <Button 
                        className="w-full" 
                        variant={isConnected ? "outline" : "default"}
                        disabled={!canManage || integration.status === "coming_soon"}
                        onClick={() => handleConnect(integration.id)}
                      >
                        {isConnected ? "Disconnect" : "Connect"}
                      </Button>
                    </PermissionTooltip>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
