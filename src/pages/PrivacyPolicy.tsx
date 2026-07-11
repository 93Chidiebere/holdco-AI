import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">HoldCo AI</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-12 prose prose-zinc dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">1. Introduction</h2>
          <p>
            Welcome to HoldCo AI. We respect your privacy and are committed to protecting your personal and corporate data. This Privacy Policy outlines how we collect, process, and secure information when you use our enterprise platform. We comply with applicable data protection regulations, including the Nigerian Data Protection Regulation (NDPR) where applicable.
          </p>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, work email address, and encrypted passwords.</li>
            <li><strong>Corporate Financial Data:</strong> Financial reports, KPIs, cash flow statements, and capital metrics uploaded by your subsidiaries.</li>
            <li><strong>Usage Data:</strong> System logs, audit trails, and metadata regarding how users interact with the platform.</li>
          </ul>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">3. How We Process Data with Third-Party AI</h2>
          <p>
            HoldCo AI utilizes advanced third-party Large Language Models (LLMs), specifically Google Gemini via enterprise API, to power our Scenario Modeling and Insight Generation features.
          </p>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-primary-foreground">
            <h3 className="font-bold mb-2">Zero Data-Training Guarantee</h3>
            <p className="text-sm">
              We use Enterprise-tier APIs for all AI processing. Financial data sent to Google Gemini through our platform is <strong>strictly isolated</strong>. It is <strong>NOT</strong> used by Google to train their base models, nor is it stored permanently by third parties. Your financial data remains confidential.
            </p>
          </div>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">4. Data Security</h2>
          <p>
            We implement stringent security measures to protect your data:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</li>
            <li><strong>Access Control:</strong> We enforce strict Role-Based Access Control (RBAC) separating IT Admins, MD/CEOs, and Analysts.</li>
            <li><strong>Audit Trails:</strong> All critical actions within the platform are logged securely for compliance and monitoring.</li>
          </ul>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">5. Data Retention and Deletion</h2>
          <p>
            We retain your corporate and personal data only for as long as your workspace account is active or as needed to provide you with the Service. If an IT Administrator deletes the workspace, all associated subsidiary data, financial records, and user accounts will be permanently purged from our active databases within 30 days.
          </p>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact your workspace IT Administrator or reach out to our legal compliance team.
          </p>
        </section>
      </div>
    </div>
  );
}
