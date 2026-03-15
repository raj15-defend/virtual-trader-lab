import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { CandlestickChart } from '@/components/trading/CandlestickChart';
import { StockFundamentals } from '@/components/trading/StockFundamentals';
import { MarketNewsFeed } from '@/components/trading/MarketNewsFeed';
import { AIPredictionPanel } from '@/components/trading/AIPredictionPanel';
import { PriceChart } from '@/components/trading/PriceChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CandlestickChartIcon,
  LineChart,
  Info,
  Newspaper,
  Brain,
  TrendingUp,
  TrendingDown,
  Loader2,
  Star,
} from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { stocks, stocksLoading, getStock, getOHLCV, news, newsLoading, getNewsByStock } = useTradingContext();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

  const stock = symbol ? getStock(symbol) : undefined;

  if (stocksLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!stock) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground text-lg">Stock not found</p>
          <Button variant="outline" onClick={() => navigate('/markets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Button>
        </div>
      </Layout>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/markets')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{stock.symbol}</h1>
                {stock.sector && (
                  <Badge variant="secondary">{stock.sector}</Badge>
                )}
                <button
                  onClick={() => toggleWatchlist(stock.id)}
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  <Star className={`h-5 w-5 ${isInWatchlist(stock.id) ? 'fill-accent text-accent' : ''}`} />
                </button>
              </div>
              <p className="text-muted-foreground text-sm">{stock.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono text-foreground">
              ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center justify-end gap-1 text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Price Chart</h2>
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-all ${chartType === 'line' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LineChart className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`p-2 rounded-md transition-all ${chartType === 'candlestick' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <CandlestickChartIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {chartType === 'candlestick' ? (
            <CandlestickChart data={getOHLCV(stock.symbol)} showVolume showMA height={300} />
          ) : (
            <PriceChart data={stock.priceHistory} isPositive={isPositive} height={280} />
          )}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Fundamentals + News + AI */}
          <div className="space-y-4">
            <Tabs defaultValue="fundamentals" className="rounded-xl border border-border bg-card">
              <TabsList className="w-full border-b border-border rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="fundamentals"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Fundamentals
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Newspaper className="h-4 w-4 mr-2" />
                  News
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis
                </TabsTrigger>
              </TabsList>
              <TabsContent value="fundamentals" className="p-4">
                <StockFundamentals stock={stock} />
              </TabsContent>
              <TabsContent value="news" className="p-4">
                <MarketNewsFeed
                  news={getNewsByStock(stock.symbol)}
                  loading={newsLoading}
                  compact
                  stockFilter={stock.symbol}
                />
              </TabsContent>
              <TabsContent value="ai" className="p-0">
                <AIPredictionPanel stock={stock} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Trading Panel */}
          <div>
            <TradingPanel stock={stock} />
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default StockDetail;
