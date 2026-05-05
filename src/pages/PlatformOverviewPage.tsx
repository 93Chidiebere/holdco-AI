import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, Users, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

interface RegisteredCompany {
  id: string;
  name: string;
  owner_email: string;
  owner_name: string;
  created_at: string;
}

export default function PlatformOverviewPage() {
  const companies = useMemo<RegisteredCompany[]>(() => {
    try { return JSON.parse(localStorage.getItem("holdco_companies") || "[]"); } catch { return []; }
  }, []);

  const stats = [
    { label: "Holding companies", value: companies.length, icon: Building2 },
    { label: "Workspace admins", value: companies.length, icon: ShieldCheck },
    { label: "Active accounts", value: companies.length, icon: Users },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Platform Overview
          </h1>
          <p className="text-muted-foreground">
            HoldCo AI parent view — every holding company workspace on the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered holding companies</CardTitle>
            <CardDescription>
              Each row is a tenant workspace. The IT Admin shown is the user who created the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {companies.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No workspaces yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holding Company</TableHead>
                    <TableHead>Workspace ID</TableHead>
                    <TableHead>IT Admin (Owner)</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{c.id}</TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">{c.owner_name}</div>
                        <div className="text-xs text-muted-foreground">{c.owner_email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Read-only platform view. HoldCo AI staff cannot modify tenant data — only inspect workspace metadata for support.
        </p>
      </div>
    </AppLayout>
  );
}
