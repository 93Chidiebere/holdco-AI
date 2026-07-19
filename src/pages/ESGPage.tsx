import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Newspaper, Globe, TrendingUp, AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { fetcher } from "@/hooks/useApi";

interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  date: string;
  impact: string;
  category: string;
}

export default function ESGPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await fetcher("/api/system/esg-news");
        setNews(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load ESG news. Please ensure backend is running.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'positive': return 'bg-success/10 text-success border-success/20';
      case 'negative': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'environmental': return <Leaf className="w-3.5 h-3.5 mr-1" />;
      case 'social': return <Globe className="w-3.5 h-3.5 mr-1" />;
      case 'governance': return <TrendingUp className="w-3.5 h-3.5 mr-1" />;
      default: return <Newspaper className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-emerald-500" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ESG Command Center</h1>
              <p className="text-muted-foreground mt-1">Real-time Environmental, Social, and Governance global intelligence.</p>
            </div>
          </div>
        </div>

        <Card className="glass-card border-primary/10">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" />
                  Live ESG Intelligence Feed
                </CardTitle>
                <CardDescription className="mt-1">
                  AI-curated global news impacting corporate sustainability and governance.
                </CardDescription>
              </div>
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="p-8 text-center text-destructive flex flex-col items-center">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>{error}</p>
              </div>
            )}
            
            {!isLoading && !error && news.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>No news available at the moment.</p>
              </div>
            )}

            <div className="divide-y divide-border/50">
              {news.map((item) => (
                <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors group">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`font-medium ${getImpactColor(item.impact)}`}>
                          {item.impact} Impact
                        </Badge>
                        <Badge variant="secondary" className="flex items-center">
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold leading-snug text-foreground/90 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {item.snippet}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium pt-1">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          {item.source}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
