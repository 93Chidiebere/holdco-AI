import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/useApi";

export default function PortalUploadPage() {
  const { token } = useParams<{ token: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [subsidiaryName, setSubsidiaryName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/portal/verify/${token}`);
        setIsValid(response.data.valid);
        setSubsidiaryName(response.data.subsidiary_name);
      } catch (error) {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };
    
    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(`/portal/upload/${token}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(response.data.message);
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              This secure upload link is invalid or has expired. Please contact your holding company administrator for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-success">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </div>
            <CardTitle>Upload Successful</CardTitle>
            <CardDescription className="mt-2">
              Your financial data has been securely transmitted to HoldCo AI. You can safely close this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Secure Data Portal</h1>
          <p className="text-muted-foreground">{subsidiaryName} Financial Submission</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Upload Financial Data</CardTitle>
            <CardDescription>
              Please upload your monthly financial data using the standardized CSV format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Required Columns</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Reporting_Month (YYYY-MM), Gross_Revenue, Cost_of_Goods_Sold, Operating_Expenses, 
                Profit_Before_Tax, Net_Income, Cash_and_Equivalents, Total_Assets, Total_Liabilities, 
                Total_Equity, Capital_Expenditure, Headcount
              </AlertDescription>
            </Alert>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <label htmlFor="csv-file" className="text-sm font-medium leading-none">
                Data File (CSV)
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleUpload} 
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" /> Submit Securely
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
