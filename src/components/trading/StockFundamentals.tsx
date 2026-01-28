import { Stock } from '@/types/trading';
import { Building2, TrendingUp, Percent, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StockFundamentalsProps {
  stock: Stock;
}

export const StockFundamentals = ({ stock }: StockFundamentalsProps) => {
  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `₹${(value / 1e6).toFixed(2)}M`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const metrics = [
    {
      label: 'Market Cap',
      value: formatMarketCap(stock.marketCap),
      icon: Building2,
    },
    {
      label: 'P/E Ratio',
      value: stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A',
      icon: TrendingUp,
    },
    {
      label: 'EPS',
      value: stock.eps ? `₹${stock.eps.toFixed(2)}` : 'N/A',
      icon: DollarSign,
    },
    {
      label: 'Div Yield',
      value: stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A',
      icon: Percent,
    },
  ];

  const priceRange = stock.fiftyTwoWeekHigh && stock.fiftyTwoWeekLow 
    ? {
        high: stock.fiftyTwoWeekHigh,
        low: stock.fiftyTwoWeekLow,
        current: stock.price,
        percentage: ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-lg border border-border bg-card/50 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <p className="font-mono text-sm font-semibold text-foreground">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* 52-Week Range */}
      {priceRange && (
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <p className="text-xs text-muted-foreground mb-2">52-Week Range</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-loss">
                <ArrowDownRight className="h-3 w-3" />
                <span>₹{priceRange.low.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1 text-profit">
                <ArrowUpRight className="h-3 w-3" />
                <span>₹{priceRange.high.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-loss via-accent to-profit"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-0 h-full w-1 bg-foreground rounded-full transform -translate-x-1/2"
                style={{ left: `${priceRange.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sector & Description */}
      {(stock.sector || stock.description) && (
        <div className="rounded-lg border border-border bg-card/50 p-3">
          {stock.sector && (
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {stock.sector}
              </span>
            </div>
          )}
          {stock.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stock.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
