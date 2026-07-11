import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the HoldCo AI platform ("Service", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. HoldCo AI provides a B2B Software-as-a-Service (SaaS) platform for holding companies to consolidate, analyze, and model financial data across their subsidiaries.
          </p>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">2. Data Ownership and Licensing</h2>
          <p>
            <strong>Your Data:</strong> You retain all rights, title, and interest in and to all data, financial records, reports, and information you upload to the Service ("Customer Data").
          </p>
          <p>
            <strong>License to Process:</strong> By uploading Customer Data, you grant HoldCo AI a limited, non-exclusive, worldwide, royalty-free license to use, process, and transmit the Customer Data solely as necessary to provide the Service to you and your authorized users.
          </p>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">3. Artificial Intelligence Disclaimer</h2>
          <p className="p-4 bg-muted/50 rounded-lg border border-border">
            <strong>CRITICAL NOTICE REGARDING AI PROJECTIONS:</strong> The Service utilizes advanced Artificial Intelligence (including third-party Large Language Models such as Google Gemini) to generate scenario models, financial projections, and capital allocation recommendations. 
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>These AI-generated outputs are predictive models based on historical data and simulated macroeconomic conditions.</li>
            <li>They do <strong>not</strong> constitute certified financial, legal, or investment advice.</li>
            <li>HoldCo AI is not a registered financial advisor or broker-dealer.</li>
            <li>You agree that all investment, capital allocation, and business decisions made based on the Service's outputs are made entirely at your own risk. HoldCo AI assumes zero liability for financial losses, misallocations, or operational disruptions resulting from your reliance on the Service.</li>
          </ul>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">4. User Roles and Security</h2>
          <p>
            Your designated IT Administrator is responsible for inviting, managing, and revoking access for other users within your organization (e.g., MD/CEO, Analysts). You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We are not liable for data breaches resulting from compromised credentials or misconfigured permissions within your organization.
          </p>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">5. Service Availability</h2>
          <p>
            We strive to ensure high availability of the Service. However, the Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the Service will be uninterrupted, completely secure, or error-free. 
          </p>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall HoldCo AI, its affiliates, directors, or employees be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use of, or inability to use, the Service.
          </p>
        </section>
      </div>
    </div>
  );
}
