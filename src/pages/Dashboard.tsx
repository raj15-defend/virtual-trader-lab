import { motion } from 'framer-motion';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/trading/StatCard';
import { StockTicker } from '@/components/trading/StockTicker';
import { PortfolioTable } from '@/components/trading/PortfolioTable';
import { PriceChart } from '@/components/trading/PriceChart';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Briefcase, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { 
    user, 
    stocks, 
    walletBalance, 
    holdings, 
    getPortfolioValue, 
    getTotalProfitLoss,
    trades 
  } = useTradingContext();

  const portfolioValue = getPortfolioValue();
  const totalProfitLoss = getTotalProfitLoss();
  const totalValue = walletBalance + portfolioValue;
  const isProfit = totalProfitLoss >= 0;

  // Get top movers
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

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
        {/* Welcome Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{user?.username}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your trading activity
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Value"
            value={`₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle="Wallet + Portfolio"
            trend="neutral"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Available Cash"
            value={`₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle="Ready to invest"
            trend="neutral"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Portfolio Value"
            value={`₹${portfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle={`${holdings.length} stocks`}
            trend="neutral"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            title="Total P&L"
            value={`${isProfit ? '+' : ''}₹${Math.abs(totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle={holdings.length > 0 ? `${isProfit ? '+' : ''}${((totalProfitLoss / (portfolioValue - totalProfitLoss)) * 100).toFixed(2)}%` : 'No positions'}
            trend={totalProfitLoss >= 0 ? 'up' : 'down'}
            icon={isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Market Overview */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Market Overview</h2>
              <Link to="/trade">
                <Button variant="ghost" size="sm" className="text-primary">
                  Trade Now <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {/* Price Chart */}
            {stocks.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{stocks[0].symbol}</h3>
                    <p className="text-sm text-muted-foreground">{stocks[0].name}</p>
                  </div>
                  <div className="text-right">
                    <p className="price-ticker text-foreground">
                      ₹{stocks[0].price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={stocks[0].change >= 0 ? 'text-profit text-sm' : 'text-loss text-sm'}>
                      {stocks[0].change >= 0 ? '+' : ''}{stocks[0].changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <PriceChart 
                  data={stocks[0].priceHistory} 
                  isPositive={stocks[0].change >= 0}
                  height={180}
                />
              </div>
            )}

            {/* Stock List */}
            <div className="grid gap-3 sm:grid-cols-2">
              {stocks.slice(0, 4).map((stock) => (
                <Link key={stock.symbol} to="/trade">
                  <StockTicker stock={stock} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Top Gainers */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Top Gainers
              </h3>
              <div className="space-y-3">
                {topGainers.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{stock.symbol}</span>
                    <span className="text-sm font-mono text-profit">
                      +{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Top Losers
              </h3>
              <div className="space-y-3">
                {topLosers.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{stock.symbol}</span>
                    <span className="text-sm font-mono text-loss">
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground mb-3">Recent Activity</h3>
              {trades.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trades yet</p>
              ) : (
                <div className="space-y-3">
                  {trades.slice(0, 3).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold ${trade.type === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                          {trade.type}
                        </span>
                        <p className="text-sm font-medium text-foreground">{trade.stockSymbol}</p>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">
                        {trade.quantity} @ ₹{trade.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {trades.length > 3 && (
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="w-full mt-3 text-primary">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        {/* Holdings Section */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Holdings</h2>
            <Link to="/portfolio">
              <Button variant="ghost" size="sm" className="text-primary">
                View Details <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <PortfolioTable />
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
