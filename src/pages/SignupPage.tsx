import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Building, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryType, setIndustryType] = useState("corporate");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // First signup = the holding company owner (MD / CEO).
    // Admins (IT) and Analysts are added later via Settings → Team invitations.
    // First signup = the workspace IT Admin. The Admin then provisions
    // the MD/CEO and Analyst accounts from Settings → Team.
    const success = await signup(name, email, password, companyName, industryType, "admin");
    setLoading(false);
    if (success) navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">H</span>
          </div>
          <span className="text-sidebar-accent-foreground font-semibold text-xl tracking-tight">HoldCo AI</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-sidebar-accent-foreground leading-tight mb-4">
            Start making<br />data-driven<br />
            <span className="text-gradient">investment decisions</span>
          </h1>
          <p className="text-sidebar-foreground text-lg max-w-md">
            Join leading organizations using AI to optimize their unit economics and performance.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sidebar-foreground text-sm">© 2026 HoldCo AI. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-sidebar-foreground/70">
            <Link to="/privacy" className="hover:text-sidebar-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-sidebar-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">H</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">HoldCo AI</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Set up your workspace</h2>
          <p className="text-muted-foreground mb-6">
            This first account is the <span className="font-medium text-foreground">IT Administrator</span>.
            You'll provision the MD/CEO and Analyst accounts from Settings → Team once you're in.
          </p>

          <div className="rounded-lg border border-border bg-muted/40 p-3 mb-6 flex gap-2.5 items-start">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              MD/CEOs and Analysts don't sign up here — they receive an invitation from
              their organization's IT Admin and use the link to set their password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Organization Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="companyName" className="pl-10" placeholder="Acme Holdings / Grace Church / Global NGO" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industryType">Organization Type</Label>
              <select 
                id="industryType" 
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="corporate">Corporate HoldCo</option>
                <option value="religious">Religious Institution (Church, Mosque)</option>
                <option value="ngo">Non-Governmental Organization (NGO)</option>
                <option value="retail">Multi-Unit Retail / Supermarkets</option>
                <option value="healthcare">Healthcare Networks (Hospital Chains, Clinics)</option>
                <option value="education">Educational Institutions (School Networks, Campuses)</option>
                <option value="real_estate">Real Estate & Property Management</option>
                <option value="logistics">Logistics & Transportation (Hubs, Gas Stations)</option>
                <option value="franchise">Franchises (Fast Food, Services)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up your workspace…" : "Create workspace as IT Admin"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
