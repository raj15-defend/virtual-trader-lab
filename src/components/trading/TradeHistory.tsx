import { useTradingContext } from '@/context/TradingContext';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export const TradeHistory = () => {
  const { trades } = useTradingContext();

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No trades yet</p>
          <p className="mt-2 text-sm">Your trade history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isBuy = trade.type === 'BUY';
              return (
                <tr
                  key={trade.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {format(new Date(trade.timestamp), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      isBuy 
                        ? "bg-success/10 text-success" 
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{trade.stockSymbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {trade.stockName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">
                    {trade.quantity}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">
                    ₹{trade.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-semibold text-foreground">
                    ₹{trade.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
