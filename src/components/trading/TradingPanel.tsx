import { useState } from 'react';
import { Stock } from '@/types/trading';
import { useTradingContext } from '@/context/TradingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Minus, Plus, Loader2 } from 'lucide-react';

interface TradingPanelProps {
  stock: Stock | null;
}

export const TradingPanel = ({ stock }: TradingPanelProps) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { buyStock, sellStock, walletBalance, holdings } = useTradingContext();

  if (!stock) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Select a stock to trade
        </div>
      </div>
    );
  }

  const totalValue = stock.price * quantity;
  const holding = holdings.find((h) => h.stockSymbol === stock.symbol);
  const maxBuyQuantity = Math.floor(walletBalance / stock.price);
  const maxSellQuantity = holding?.quantity || 0;
  const isPositive = stock.change >= 0;

  const handleTrade = async () => {
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const result = tradeType === 'BUY' 
        ? await buyStock(stock.symbol, quantity) 
        : await sellStock(stock.symbol, quantity);

      if (result.success) {
        toast.success(result.message);
        setQuantity(1);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    const max = tradeType === 'BUY' ? maxBuyQuantity : maxSellQuantity;
    setQuantity(Math.min(newQuantity, max));
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Stock Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{stock.symbol}</h3>
            <p className="text-sm text-muted-foreground">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="price-ticker text-2xl text-foreground">
              ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className={cn(
              "flex items-center justify-end gap-1 mt-1 text-sm font-medium",
              isPositive ? "text-profit" : "text-loss"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Stock Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">High</p>
            <p className="font-mono font-medium text-foreground">₹{stock.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Low</p>
            <p className="font-mono font-medium text-foreground">₹{stock.low.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Volume</p>
            <p className="font-mono font-medium text-foreground">{(stock.volume / 1000000).toFixed(1)}M</p>
          </div>
        </div>
      </div>

      {/* Trade Type Selector */}
      <div className="border-b border-border p-4">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setTradeType('BUY')}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
              tradeType === 'BUY'
                ? "bg-success text-success-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            BUY
          </button>
          <button
            onClick={() => setTradeType('SELL')}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
              tradeType === 'SELL'
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            SELL
          </button>
        </div>
      </div>

      {/* Quantity Input */}
      <div className="p-6 space-y-4">
        <div>
          <Label className="text-muted-foreground">Quantity</Label>
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustQuantity(-1)}
              disabled={quantity <= 1}
              className="shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="trading-input text-center"
              min={1}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustQuantity(1)}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Max: {tradeType === 'BUY' ? maxBuyQuantity : maxSellQuantity} shares
          </p>
        </div>

        {/* Order Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price per share</span>
            <span className="font-mono text-foreground">₹{stock.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-mono text-foreground">× {quantity}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-mono font-bold text-lg text-foreground">
              ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Current Holding */}
        {holding && (
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You own</span>
              <span className="font-mono text-foreground">{holding.quantity} shares</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Avg. price</span>
              <span className="font-mono text-foreground">₹{holding.avgBuyPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={
            loading ||
            (tradeType === 'BUY' && totalValue > walletBalance) ||
            (tradeType === 'SELL' && quantity > maxSellQuantity)
          }
          className={cn(
            "w-full py-6 text-lg font-bold transition-all",
            tradeType === 'BUY'
              ? "bg-success hover:bg-success/90 text-success-foreground"
              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            tradeType === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'
          )}
        </Button>

        {/* Balance Warning */}
        {tradeType === 'BUY' && totalValue > walletBalance && (
          <p className="text-center text-sm text-destructive">
            Insufficient balance. You need ₹{(totalValue - walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} more.
          </p>
        )}
      </div>
    </div>
  );
};
