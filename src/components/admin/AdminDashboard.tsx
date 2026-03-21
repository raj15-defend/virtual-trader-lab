import { motion } from 'framer-motion';
import { Users, ArrowLeftRight, IndianRupee, Activity, TrendingUp, BarChart3, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';
import type { AdminTransaction, AdminWithdrawalRequest } from '@/hooks/useAdmin';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)'];
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Props {
  allTransactions: AdminTransaction[];
  withdrawalRequests: AdminWithdrawalRequest[];
  fraudAlertCount: number;
  totalUsers: number;
  activeUsers: number;
}

const formatCurrency = (val: number) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val.toLocaleString('en-IN')}`;

export function AdminDashboard({ allTransactions, withdrawalRequests, fraudAlertCount, totalUsers, activeUsers }: Props) {
  const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending');
  const totalDeposits = allTransactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalRevenue = allTransactions.reduce((s, t) => s + t.amount, 0);

  const monthlyData = useMemo(() => {
    const months: { name: string; deposits: number; withdrawals: number; trades: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthTxns = allTransactions.filter(t => {
        try { return isWithinInterval(new Date(t.created_at), { start, end }); } catch { return false; }
      });
      months.push({
        name: format(monthDate, 'MMM'),
        deposits: monthTxns.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0),
        withdrawals: monthTxns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0),
        trades: monthTxns.filter(t => t.type === 'trade_buy' || t.type === 'trade_sell').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [allTransactions]);

  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    allTransactions.forEach(t => {
      const label = t.type === 'deposit' ? 'Deposits' : t.type === 'withdrawal' ? 'Withdrawals' : t.type === 'trade_buy' ? 'Buys' : t.type === 'trade_sell' ? 'Sells' : 'Other';
      types[label] = (types[label] || 0) + t.amount;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [allTransactions]);

  const cumulativeRevenue = useMemo(() => {
    let running = 0;
    return monthlyData.map(m => { running += m.deposits - m.withdrawals; return { name: m.name, revenue: running }; });
  }, [monthlyData]);

  const statCards = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Total Trades', value: allTransactions.length, icon: ArrowLeftRight, color: 'text-accent-foreground' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-success' },
    { label: 'Active Users', value: activeUsers, icon: Activity, color: 'text-primary' },
    { label: 'Pending W/D', value: pendingWithdrawals.length, icon: Clock, color: 'text-warning' },
    { label: 'Fraud Alerts', value: fraudAlertCount, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-2 rounded-lg bg-muted/50", stat.color)}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, undefined]} />
                <Bar dataKey="deposits" name="Deposits" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="trades" name="Trades" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <defs>
                  <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#adminRevGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {typeDistribution.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Distribution</CardTitle></CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {typeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader>
          <ScrollArea className="h-[220px]">
            <CardContent className="p-0">
              {allTransactions.slice(0, 8).map(txn => (
                <div key={txn.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{txn.username}</p>
                    <p className="text-xs text-muted-foreground">{txn.description || txn.type} • {format(new Date(txn.created_at), 'dd MMM, HH:mm')}</p>
                  </div>
                  <span className={cn("text-sm font-mono font-semibold", txn.type === 'deposit' ? 'text-success' : 'text-destructive')}>
                    ₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
