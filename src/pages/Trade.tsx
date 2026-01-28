import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { StockTicker } from '@/components/trading/StockTicker';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { CandlestickChart } from '@/components/trading/CandlestickChart';
import { StockFundamentals } from '@/components/trading/StockFundamentals';
import { MarketNewsFeed } from '@/components/trading/MarketNewsFeed';
import { Stock } from '@/types/trading';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CandlestickChartIcon, LineChart, Info, Newspaper, Loader2 } from 'lucide-react';
import { PriceChart } from '@/components/trading/PriceChart';

const Trade = () => {
  const { stocks, stocksLoading, getOHLCV, news, newsLoading, getNewsByStock } = useTradingContext();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

  // Set first stock as default when stocks load
  if (!selectedStock && stocks.length > 0) {
    setSelectedStock(stocks[0]);
  }

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (stocksLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-foreground">Trade Stocks</h1>
          <p className="text-muted-foreground mt-1">
            Select a stock and place your order
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Stock List */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stock List */}
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {filteredStocks.map((stock) => (
                <StockTicker
                  key={stock.symbol}
                  stock={stock}
                  isSelected={selectedStock?.symbol === stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                />
              ))}
              {filteredStocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No stocks found
                </div>
              )}
            </div>
          </motion.div>

          {/* Trading Section */}
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-4">
            {selectedStock && (
              <>
                {/* Price Chart Card */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedStock.symbol}</h2>
                      <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Chart Type Toggle */}
                      <div className="flex rounded-lg bg-muted p-1">
                        <button
                          onClick={() => setChartType('line')}
                          className={`p-2 rounded-md transition-all ${
                            chartType === 'line'
                              ? 'bg-background shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <LineChart className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setChartType('candlestick')}
                          className={`p-2 rounded-md transition-all ${
                            chartType === 'candlestick'
                              ? 'bg-background shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <CandlestickChartIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="price-ticker text-2xl text-foreground">
                          ₹{selectedStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={selectedStock.change >= 0 ? 'text-profit text-sm' : 'text-loss text-sm'}>
                          {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  {chartType === 'candlestick' ? (
                    <CandlestickChart
                      data={getOHLCV(selectedStock.symbol)}
                      showVolume={true}
                      showMA={true}
                      height={280}
                    />
                  ) : (
                    <PriceChart
                      data={selectedStock.priceHistory}
                      isPositive={selectedStock.change >= 0}
                      height={250}
                    />
                  )}
                </div>

                {/* Tabs for Fundamentals and News */}
                <div className="grid gap-4 lg:grid-cols-2">
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
                    </TabsList>
                    <TabsContent value="fundamentals" className="p-4">
                      <StockFundamentals stock={selectedStock} />
                    </TabsContent>
                    <TabsContent value="news" className="p-4">
                      <MarketNewsFeed
                        news={getNewsByStock(selectedStock.symbol)}
                        loading={newsLoading}
                        compact
                        stockFilter={selectedStock.symbol}
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Trading Panel */}
                  <TradingPanel stock={selectedStock} />
                </div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Trade;
