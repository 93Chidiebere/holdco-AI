import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockSubsidiaries } from "@/data/mockData";
import type { Subsidiary } from "@/types";
import { Plus, Pencil, Trash2, Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionTooltip from "@/components/PermissionTooltip";

const industries = ["Technology", "Agriculture", "Financial Services", "Energy", "Healthcare", "Manufacturing", "Retail"];
const countries = ["Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", "Tanzania"];
const currencies = ["NGN", "KES", "ZAR", "GHS", "EGP", "TZS", "USD"];

export default function SubsidiariesPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("manage_subsidiaries");
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>(mockSubsidiaries);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subsidiary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subsidiary | null>(null);
  const [form, setForm] = useState({ name: "", industry: "", country: "", currency: "", description: "" });

  const filtered = subsidiaries.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.industry.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", industry: "", country: "", currency: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (sub: Subsidiary) => {
    setEditing(sub);
    setForm({ name: sub.name, industry: sub.industry, country: sub.country, currency: sub.currency, description: sub.description });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.industry || !form.country || !form.currency) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editing) {
      setSubsidiaries(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      toast.success("Subsidiary updated");
    } else {
      const newSub: Subsidiary = { id: Date.now().toString(), ...form, created_at: new Date().toISOString().split("T")[0] };
      setSubsidiaries(prev => [...prev, newSub]);
      toast.success("Subsidiary created");
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setSubsidiaries(prev => prev.filter(s => s.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" has been deleted`);
    setDeleteTarget(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subsidiaries</h1>
            <p className="text-muted-foreground mt-1">Manage your portfolio companies</p>
          </div>
          <PermissionTooltip hasPermission={canManage} message="Only admins can add subsidiaries.">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} disabled={!canManage}><Plus className="w-4 h-4 mr-2" /> Add Subsidiary</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Subsidiary" : "Add Subsidiary"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Company name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry *</Label>
                    <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency *</Label>
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
                </div>
                <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          </PermissionTooltip>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search subsidiaries..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(sub => (
            <Card key={sub.id} className="glass-card group">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <Link to={`/subsidiaries/${sub.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{sub.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{sub.country} · {sub.currency}</p>
                  </div>
                </Link>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sub)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(sub)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs mb-2">{sub.industry}</Badge>
                <p className="text-sm text-muted-foreground">{sub.description}</p>
                <p className="text-xs text-muted-foreground mt-3">Created {sub.created_at}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete subsidiary?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
