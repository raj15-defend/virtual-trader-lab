import { Stock } from "@/types/trading";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockTickerProps {
  stock: Stock;
  isSelected?: boolean;
  onClick?: () => void;
}

export const StockTicker = ({ stock, isSelected, onClick }: StockTickerProps) => {
  const isPositive = stock.change >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg border border-border bg-card p-4 cursor-pointer transition-all duration-200",
        "hover:border-primary/50 hover:bg-card/80",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{stock.symbol}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {stock.name}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Vol: {(stock.volume / 1000000).toFixed(1)}M
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="price-ticker text-foreground">
          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1 text-sm font-medium",
          isPositive ? "text-profit" : "text-loss"
        )}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
          <span>({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
};
