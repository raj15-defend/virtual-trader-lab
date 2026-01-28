import { motion } from 'framer-motion';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/trading/StatCard';
import { PortfolioTable } from '@/components/trading/PortfolioTable';
import { PriceChart } from '@/components/trading/PriceChart';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Wallet, TrendingUp, TrendingDown, Briefcase, PieChart, Loader2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const Portfolio = () => {
  const { 
    walletBalance, 
    holdings, 
    stocksLoading,
    getPortfolioValue, 
    getTotalProfitLoss 
  } = useTradingContext();

  const portfolioValue = getPortfolioValue();
  const totalProfitLoss = getTotalProfitLoss();
  const totalValue = walletBalance + portfolioValue;
  const isProfit = totalProfitLoss >= 0;

  // Portfolio distribution chart data
  const chartData = {
    labels: holdings.map((h) => h.stockSymbol),
    datasets: [
      {
        data: holdings.map((h) => h.totalValue),
        backgroundColor: [
          'hsl(160, 84%, 39%)',
          'hsl(43, 96%, 56%)',
          'hsl(217, 91%, 60%)',
          'hsl(0, 84%, 60%)',
          'hsl(280, 84%, 60%)',
          'hsl(120, 84%, 39%)',
          'hsl(30, 84%, 50%)',
          'hsl(200, 84%, 50%)',
        ],
        borderColor: 'hsl(222, 47%, 8%)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'hsl(215, 20%, 55%)',
          padding: 15,
          font: {
            family: 'JetBrains Mono',
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 10%)',
        titleColor: 'hsl(210, 40%, 98%)',
        bodyColor: 'hsl(210, 40%, 98%)',
        borderColor: 'hsl(222, 30%, 18%)',
        borderWidth: 1,
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { raw: number };
            const value = ctx.raw;
            const percentage = portfolioValue > 0 ? ((value / portfolioValue) * 100).toFixed(1) : 0;
            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Portfolio value history (simulated)
  const portfolioHistory = holdings.length > 0
    ? Array.from({ length: 10 }, (_, i) => {
        const variation = (Math.random() - 0.5) * 0.02 * portfolioValue;
        return portfolioValue + variation * (i - 5);
      })
    : [];

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
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Track your investments and performance
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
            subtitle={`${((walletBalance / totalValue) * 100).toFixed(1)}% of total`}
            trend="neutral"
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Invested Value"
            value={`₹${portfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle={`${holdings.length} stocks`}
            trend="neutral"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            title="Total P&L"
            value={`${isProfit ? '+' : ''}₹${Math.abs(totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            subtitle={holdings.length > 0 && portfolioValue - totalProfitLoss > 0 ? `${isProfit ? '+' : ''}${((totalProfitLoss / (portfolioValue - totalProfitLoss)) * 100).toFixed(2)}%` : 'No positions'}
            trend={totalProfitLoss >= 0 ? 'up' : 'down'}
            icon={isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          />
        </motion.div>

        {/* Charts Row */}
        {holdings.length > 0 && (
          <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
            {/* Portfolio Distribution */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Portfolio Distribution</h2>
              </div>
              <div className="h-[250px]">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Portfolio Value Chart */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Portfolio Performance</h2>
              </div>
              <PriceChart
                data={portfolioHistory}
                isPositive={isProfit}
                height={250}
              />
            </div>
          </motion.div>
        )}

        {/* Holdings Table */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Holdings</h2>
          <PortfolioTable />
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Portfolio;
