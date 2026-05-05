import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessRequestProvider } from "@/contexts/AccessRequestContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedPage from "@/components/ProtectedPage";
import AccessRequestGate from "@/components/AccessRequestGate";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import SubsidiariesPage from "./pages/SubsidiariesPage";
import SubsidiaryDetailPage from "./pages/SubsidiaryDetailPage";
import UploadPage from "./pages/UploadPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import InsightsPage from "./pages/InsightsPage";
import CapitalPage from "./pages/CapitalPage";
import ScenarioPage from "./pages/ScenarioPage";
import AlertsPage from "./pages/AlertsPage";
import ExportPage from "./pages/ExportPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import SettingsPage from "./pages/SettingsPage";
import PlatformOverviewPage from "./pages/PlatformOverviewPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Platform owner is locked to the platform overview — they don't operate inside tenants.
  if (user?.role === "superadmin" && typeof window !== "undefined" && window.location.pathname !== "/platform") {
    return <Navigate to="/platform" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/platform" element={<ProtectedRoute><PlatformOverviewPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/subsidiaries" element={<ProtectedRoute><ProtectedPage permission="view_subsidiaries"><SubsidiariesPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/subsidiaries/:id" element={<ProtectedRoute><ProtectedPage permission="view_subsidiaries"><SubsidiaryDetailPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><ProtectedPage permission="upload_reports"><UploadPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><ProtectedPage permission="view_analytics"><AnalyticsPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><ProtectedPage permission="view_insights"><InsightsPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/capital" element={<ProtectedRoute><ProtectedPage permission="view_capital"><AccessRequestGate module="manage_capital" moduleLabel="Capital Allocation"><CapitalPage /></AccessRequestGate></ProtectedPage></ProtectedRoute>} />
      <Route path="/scenarios" element={<ProtectedRoute><ProtectedPage permission="view_scenarios"><AccessRequestGate module="manage_scenarios" moduleLabel="Scenario Modeling"><ScenarioPage /></AccessRequestGate></ProtectedPage></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><ProtectedPage permission="view_alerts"><AlertsPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><ProtectedPage permission="view_export"><ExportPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><ProtectedPage permission="view_audit"><AuditTrailPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><ProtectedPage permission="view_settings"><SettingsPage /></ProtectedPage></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// App root
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AccessRequestProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AccessRequestProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
