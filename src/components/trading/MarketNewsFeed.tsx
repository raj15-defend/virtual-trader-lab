import { MarketNews } from '@/types/trading';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketNewsFeedProps {
  news: MarketNews[];
  loading?: boolean;
  compact?: boolean;
  stockFilter?: string;
}

export const MarketNewsFeed = ({ 
  news, 
  loading = false, 
  compact = false,
  stockFilter 
}: MarketNewsFeedProps) => {
  const filteredNews = stockFilter 
    ? news.filter(n => n.stockSymbol === stockFilter)
    : news;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredNews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Newspaper className="h-8 w-8 mb-2" />
        <p className="text-sm">No news available</p>
      </div>
    );
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-profit" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-loss" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-profit';
      case 'negative':
        return 'border-l-loss';
      default:
        return 'border-l-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-3", compact ? "max-h-[400px] overflow-y-auto pr-2" : "")}>
      {filteredNews.map((item) => (
        <article
          key={item.id}
          className={cn(
            "rounded-lg border border-border bg-card/50 p-3 border-l-4 transition-colors hover:bg-card",
            getSentimentClass(item.sentiment)
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getSentimentIcon(item.sentiment)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium text-foreground leading-tight",
                compact ? "text-sm" : "text-base"
              )}>
                {item.title}
              </h4>
              {!compact && item.summary && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="font-medium">{item.source}</span>
                <span>•</span>
                <time>
                  {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                </time>
                {item.stockSymbol && (
                  <>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                      {item.stockSymbol}
                    </span>
                  </>
                )}
              </div>
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};
