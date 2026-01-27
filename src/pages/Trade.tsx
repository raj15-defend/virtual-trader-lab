import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { StockTicker } from '@/components/trading/StockTicker';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { PriceChart } from '@/components/trading/PriceChart';
import { Stock } from '@/types/trading';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Trade = () => {
  const { stocks } = useTradingContext();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(stocks[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

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

        <div className="grid gap-6 lg:grid-cols-3">
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
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            {/* Price Chart */}
            {selectedStock && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedStock.symbol}</h2>
                    <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
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
                <PriceChart
                  data={selectedStock.priceHistory}
                  isPositive={selectedStock.change >= 0}
                  height={250}
                />
              </div>
            )}

            {/* Trading Panel */}
            <TradingPanel stock={selectedStock} />
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Trade;
