import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Settings, Users, Building2, UserPlus, Trash2, Mail, ShieldAlert, Sun, Moon, ShieldCheck, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccessRequests } from "@/contexts/AccessRequestContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  status: "active" | "invited";
  joined: string;
}

const initialMembers: TeamMember[] = [
  { id: "1", name: "Admin User", email: "admin@holdco.com", role: "admin", status: "active", joined: "2024-01-15" },
  { id: "2", name: "Jane Analyst", email: "jane@holdco.com", role: "analyst", status: "active", joined: "2024-06-10" },
  { id: "3", name: "Mark Viewer", email: "mark@holdco.com", role: "viewer", status: "invited", joined: "2026-03-05" },
];

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  analyst: "bg-info/10 text-info",
  viewer: "bg-muted text-muted-foreground",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const { requests, approve, reject, revoke, grantsFor } = useAccessRequests();
  const [members, setMembers] = useState(initialMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"analyst" | "viewer">("viewer");
  const [companyName, setCompanyName] = useState(user?.holding_company_name || "");
  const [profileName, setProfileName] = useState(user?.name || "");

  const canGrant = hasPermission("grant_access");
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const decidedRequests = requests.filter((r) => r.status !== "pending").slice(-10).reverse();
  const moduleLabel = (m: string) => (m === "manage_capital" ? "Capital Allocation" : m === "manage_scenarios" ? "Scenario Modeling" : m);

  const handleInvite = () => {
    if (!inviteEmail) return;
    const inferredName = inviteEmail.split("@")[0];
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inferredName,
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      joined: new Date().toISOString().split("T")[0],
    };
    setMembers((prev) => [...prev, newMember]);
    // Persist role + name + tenant so the invited user signs in with the correct
    // role (mock auth reads these keys on login). Same scheme used by signup().
    localStorage.setItem(`holdco_role_${inviteEmail}`, inviteRole);
    localStorage.setItem(`holdco_name_${inviteEmail}`, inferredName);
    if (user?.holding_company_name) {
      localStorage.setItem(`holdco_company_${inviteEmail}`, user.holding_company_name);
    }
    if (user?.holding_company_id) {
      localStorage.setItem(`holdco_companyid_${inviteEmail}`, user.holding_company_id);
    }
    setInviteEmail("");
    setInviteOpen(false);
    toast.success("Invitation sent", { description: `Invited ${inviteEmail} as ${inviteRole}` });
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success("Team member removed");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6" /> Settings
          </h1>
          <p className="text-muted-foreground">Manage your team, company profile, and platform preferences</p>
        </div>

        <Tabs defaultValue={canGrant ? "access" : isAdmin ? "team" : "profile"}>
          <TabsList>
            {hasPermission("manage_team") && (
              <TabsTrigger value="team" className="gap-2"><Users className="w-4 h-4" /> Team</TabsTrigger>
            )}
            {canGrant && (
              <TabsTrigger value="access" className="gap-2">
                <ShieldCheck className="w-4 h-4" /> Access Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-1 text-[10px] font-semibold bg-warning text-warning-foreground px-1.5 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {hasPermission("manage_company") && (
              <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" /> Company</TabsTrigger>
            )}
            <TabsTrigger value="profile" className="gap-2"><Settings className="w-4 h-4" /> Profile</TabsTrigger>
          </TabsList>

          {/* Team Tab - Admin only */}
          {hasPermission("manage_team") && <TabsContent value="team" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{members.length} team members</p>
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-1" /> Invite Member
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${roleColors[member.role]}`}>
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.role !== "admin" && (
                            <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>}

          {/* Access Requests Tab - Admin & MD/CEO */}
          {canGrant && <TabsContent value="access" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Pending requests</CardTitle>
                <CardDescription>
                  Approve or reject analyst requests to access Capital Allocation and Scenario Modeling.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pendingRequests.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">No pending requests.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{r.user_name}</div>
                            <div className="text-xs text-muted-foreground">{r.user_email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{moduleLabel(r.module)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[280px] text-sm text-muted-foreground truncate" title={r.reason}>
                            {r.reason}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => { reject(r.id, user?.email || ""); toast.success("Request rejected"); }}>
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                              <Button size="sm" onClick={() => { approve(r.id, user?.email || ""); toast.success(`Granted ${moduleLabel(r.module)} to ${r.user_name}`); }}>
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Active grants */}
            <Card>
              <CardHeader>
                <CardTitle>Active grants</CardTitle>
                <CardDescription>Analysts who currently have approved access. Revoke at any time.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  const grantedUsers = Array.from(new Set(requests.filter((r) => r.status === "approved").map((r) => r.user_email)))
                    .map((email) => {
                      const last = requests.filter((r) => r.user_email === email && r.status === "approved").slice(-1)[0];
                      return { email, name: last?.user_name || email, modules: grantsFor(email) };
                    })
                    .filter((u) => u.modules.length > 0);
                  if (grantedUsers.length === 0) {
                    return <p className="px-6 pb-6 text-sm text-muted-foreground">No active grants yet.</p>;
                  }
                  return (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Granted modules</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grantedUsers.map((u) => (
                          <TableRow key={u.email}>
                            <TableCell>
                              <div className="font-medium text-foreground">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {u.modules.map((m) => (
                                  <Badge key={m} variant="secondary" className="text-xs">{moduleLabel(m)}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {u.modules.map((m) => (
                                  <Button key={m} size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                                    onClick={() => { revoke(u.email, m); toast.success(`Revoked ${moduleLabel(m)} from ${u.name}`); }}>
                                    Revoke {moduleLabel(m)}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Recent decisions */}
            {decidedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent decisions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Decided by</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {decidedRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{r.user_name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{moduleLabel(r.module)}</Badge></TableCell>
                          <TableCell>
                            <Badge className={r.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.decided_by}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.decided_at ? new Date(r.decided_at).toLocaleString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>}

          {/* Company Tab - Admin only */}
          {hasPermission("manage_company") && <TabsContent value="company" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Update your holding company information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company ID</Label>
                  <Input value={user?.holding_company_id || ""} disabled className="opacity-60" />
                </div>
                <Button onClick={() => toast.success("Company profile updated")}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>}

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your personal account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role || ""} disabled className="opacity-60 capitalize" />
                </div>
                <Button onClick={() => toast.success("Profile updated")}>Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between max-w-md">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-warning" />}
                    <div>
                      <Label className="text-sm font-medium">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your holding company workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "analyst" | "viewer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">MD / CEO — Primary decision-maker (full business rights)</SelectItem>
                  <SelectItem value="analyst">Analyst — Uploads data, runs analysis (gated approvals)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>
              <Mail className="w-4 h-4 mr-1" /> Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
