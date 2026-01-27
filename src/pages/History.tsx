import { motion } from 'framer-motion';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { format } from 'date-fns';
import { History as HistoryIcon, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const History = () => {
  const { trades, walletTransactions, walletBalance } = useTradingContext();

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
          <h1 className="text-2xl font-bold text-foreground">Trade History</h1>
          <p className="text-muted-foreground mt-1">
            View all your past trades and transactions
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Trade History */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <HistoryIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">All Trades</h2>
            </div>
            <TradeHistory />
          </motion.div>

          {/* Wallet Transactions */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Wallet Activity</h2>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Current Balance */}
              <div className="border-b border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold font-mono text-foreground">
                  ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Transactions List */}
              <div className="max-h-[400px] overflow-y-auto">
                {walletTransactions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {walletTransactions.map((transaction) => {
                      const isCredit = transaction.type === 'CREDIT';
                      return (
                        <div
                          key={transaction.id}
                          className="p-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "rounded-full p-1.5",
                              isCredit ? "bg-success/10" : "bg-destructive/10"
                            )}>
                              {isCredit ? (
                                <ArrowDownCircle className="h-4 w-4 text-success" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(transaction.timestamp), 'dd MMM yyyy, HH:mm')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-mono font-semibold",
                                isCredit ? "text-profit" : "text-loss"
                              )}>
                                {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                Bal: ₹{transaction.balance.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Summary Stats */}
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-3xl font-bold font-mono text-foreground mt-2">{trades.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Buy Orders</p>
            <p className="text-3xl font-bold font-mono text-profit mt-2">
              {trades.filter((t) => t.type === 'BUY').length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Sell Orders</p>
            <p className="text-3xl font-bold font-mono text-loss mt-2">
              {trades.filter((t) => t.type === 'SELL').length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default History;
