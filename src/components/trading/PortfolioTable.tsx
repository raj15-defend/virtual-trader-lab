import { useTradingContext } from '@/context/TradingContext';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const PortfolioTable = () => {
  const { holdings } = useTradingContext();

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No holdings yet</p>
          <p className="mt-2 text-sm">Start trading to build your portfolio</p>
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
                Stock
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avg. Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const isProfit = holding.profitLoss >= 0;
              return (
                <tr
                  key={holding.stockSymbol}
                  className="border-b border-border/50 transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{holding.stockSymbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {holding.stockName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">
                    {holding.quantity}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">
                    ₹{holding.avgBuyPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-foreground">
                    ₹{holding.currentPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-semibold text-foreground">
                    ₹{holding.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className={cn(
                      "flex items-center justify-end gap-1 font-mono font-semibold",
                      isProfit ? "text-profit" : "text-loss"
                    )}>
                      {isProfit ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <div>
                        <span>{isProfit ? '+' : ''}</span>
                        <span>₹{Math.abs(holding.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="ml-1 text-xs">
                          ({isProfit ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
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
