import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Key, Activity, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default function DeveloperSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    const token = localStorage.getItem("holdco_token");
    const res = await fetch(`${API_BASE_URL}/api/keys/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch keys");
    return res.json();
  };

  const fetchJobs = async () => {
    const token = localStorage.getItem("holdco_token");
    const res = await fetch(`${API_BASE_URL}/api/keys/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch jobs");
    return res.json();
  };

  const { data: keys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: fetchKeys
  });

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['asyncJobs'],
    queryFn: fetchJobs,
    refetchInterval: 10000 // Poll every 10 seconds
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = localStorage.getItem("holdco_token");
      const res = await fetch(`${API_BASE_URL}/api/keys/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Failed to create key");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setNewKeyName("");
      toast({ title: "API Key Created", description: "Please copy it immediately." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create API key.", variant: "destructive" });
    }
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("holdco_token");
      const res = await fetch(`${API_BASE_URL}/api/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to revoke key");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast({ title: "API Key Revoked", description: "The key can no longer be used." });
    }
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for the API key.", variant: "destructive" });
      return;
    }
    createKeyMutation.mutate(newKeyName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "API Key copied to clipboard." });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Developer Settings</h1>
          <p className="text-slate-500 mt-2">Manage your API keys and monitor webhooks for the Intelligence Engine.</p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Webhook Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Generate keys to authenticate requests to the HoldCo AIaaS endpoints.
                </CardDescription>
              </div>
              <Button onClick={() => setIsKeyDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Generate New Key
              </Button>
            </CardHeader>
            <CardContent>
              {loadingKeys ? (
                <p className="text-muted-foreground text-sm">Loading keys...</p>
              ) : keys.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Key className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>You haven't generated any API keys yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key: any) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-xs">{key.prefix}...</code></TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(key.created_at)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(key.last_used_at)}</TableCell>
                        <TableCell>
                          <Badge variant={key.is_active ? "default" : "secondary"} className={key.is_active ? "bg-emerald-500" : ""}>
                            {key.is_active ? "Active" : "Revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => revokeKeyMutation.mutate(key.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader className="border-b pb-4 mb-4">
              <CardTitle>Webhook Delivery Logs</CardTitle>
              <CardDescription>
                History of background asynchronous jobs and their webhook delivery status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <p className="text-muted-foreground text-sm">Loading logs...</p>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No jobs have been processed yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell><code className="text-xs text-slate-500">{job.id.substring(0, 8)}...</code></TableCell>
                        <TableCell>{job.job_type}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}
                                 className={job.status === "completed" ? "bg-emerald-500" : job.status === "processing" ? "bg-blue-500 text-white" : ""}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(job.created_at)}</TableCell>
                        <TableCell className="text-sm text-red-500">{job.error || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Key Dialog */}
      <Dialog open={isKeyDialogOpen} onOpenChange={(open) => {
        setIsKeyDialogOpen(open);
        if (!open) {
          setGeneratedKey(null);
          setNewKeyName("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{generatedKey ? "Your API Key" : "Generate API Key"}</DialogTitle>
            <DialogDescription>
              {generatedKey 
                ? "Please copy this key and save it somewhere safe. For security reasons, you will not be able to view it again." 
                : "Create a new API key to authenticate requests from your external ERP or systems."}
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="bg-slate-100 p-4 rounded-md flex items-center justify-between border border-slate-200">
              <code className="text-sm font-medium text-slate-800 break-all">{generatedKey}</code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <Input 
                placeholder="e.g., Production ERP System" 
                value={newKeyName} 
                onChange={(e) => setNewKeyName(e.target.value)} 
              />
            </div>
          )}

          <DialogFooter>
            {generatedKey ? (
              <Button onClick={() => setIsKeyDialogOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="w-4 h-4 mr-2" /> I have copied my key
              </Button>
            ) : (
              <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending} className="w-full">
                {createKeyMutation.isPending ? "Generating..." : "Generate Key"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
