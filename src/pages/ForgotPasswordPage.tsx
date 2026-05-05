import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MailCheck } from "lucide-react";

const REDIRECT_SECONDS = 5;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!submitted) return;
    setCountdown(REDIRECT_SECONDS);
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const redirect = setTimeout(() => navigate("/login"), REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [submitted, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending the reset email — backend will replace this later.
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">H</span>
          </div>
          <span className="text-sidebar-accent-foreground font-semibold text-xl tracking-tight">HoldCo AI</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-sidebar-accent-foreground leading-tight mb-4">
            Reset your<br /><span className="text-gradient">access</span>
          </h1>
          <p className="text-sidebar-foreground text-lg max-w-md">
            We'll send a secure link to your work email so you can set a new password and get back to your portfolio.
          </p>
        </div>
        <p className="text-sidebar-foreground text-sm">© 2026 HoldCo AI. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">H</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">HoldCo AI</span>
          </div>

          {submitted ? (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <MailCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
                <p className="text-muted-foreground">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link. The link expires in 30 minutes.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Didn't receive it? Check your spam folder, or{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary hover:underline font-medium"
                >
                  try a different email
                </button>
                .
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to sign in {countdown > 0 ? `(${countdown}s)` : ""}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Forgot your password?</h2>
              <p className="text-muted-foreground mb-8">
                Enter the email tied to your HoldCo AI account and we'll send a secure reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending link…" : "Send reset link"}
                </Button>
              </form>

              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
