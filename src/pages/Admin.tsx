import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, Users, AlertTriangle, IndianRupee, ArrowUpFromLine, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/hooks/useAdmin';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(142 71% 45%)', 'hsl(var(--warning, 38 92% 50%))'];

export default function Admin() {
  const { isAdmin, loading, withdrawalRequests, allTransactions, approveWithdrawal, rejectWithdrawal, refreshData } = useAdmin();
  const { alerts: fraudAlerts } = useFraudDetection();
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' }>({ open: false, id: '', action: 'approve' });
  const [adminNotes, setAdminNotes] = useState('');

  // Analytics data
  const monthlyData = useMemo(() => {
    const months: { name: string; deposits: number; withdrawals: number; trades: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthName = format(monthDate, 'MMM yyyy');

      const monthTxns = allTransactions.filter(t => {
        try {
          return isWithinInterval(new Date(t.created_at), { start, end });
        } catch { return false; }
      });

      months.push({
        name: monthName,
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
      const label = t.type === 'deposit' ? 'Deposits' : t.type === 'withdrawal' ? 'Withdrawals' : t.type === 'trade_buy' ? 'Buy Trades' : t.type === 'trade_sell' ? 'Sell Trades' : 'Other';
      types[label] = (types[label] || 0) + t.amount;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [allTransactions]);

  const cumulativeRevenue = useMemo(() => {
    let running = 0;
    return monthlyData.map(m => {
      running += m.deposits - m.withdrawals;
      return { name: m.name, revenue: running };
    });
  }, [monthlyData]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don't have admin privileges to access this page.</p>
        </div>
      </Layout>
    );
  }

  const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending');
  const totalPendingAmount = pendingWithdrawals.reduce((s, r) => s + r.amount, 0);
  const totalTransactionVolume = allTransactions.reduce((s, t) => s + t.amount, 0);
  const totalDeposits = allTransactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = allTransactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);

  const handleReview = async () => {
    if (reviewDialog.action === 'approve') {
      await approveWithdrawal(reviewDialog.id, adminNotes);
    } else {
      await rejectWithdrawal(reviewDialog.id, adminNotes);
    }
    setReviewDialog({ open: false, id: '', action: 'approve' });
    setAdminNotes('');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/30',
      approved: 'bg-success/10 text-success border-success/30',
      completed: 'bg-success/10 text-success border-success/30',
      rejected: 'bg-destructive/10 text-destructive border-destructive/30',
      failed: 'bg-destructive/10 text-destructive border-destructive/30',
    };
    return (
      <Badge variant="outline" className={cn("text-xs", styles[status] || '')}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (val: number) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val.toLocaleString('en-IN')}`;

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 p-4 md:p-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" /> Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage transactions, withdrawals, and monitor activities</p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Clock className="h-4 w-4" /> Pending</div>
              <p className="text-2xl font-bold text-warning mt-1">{pendingWithdrawals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><IndianRupee className="h-4 w-4" /> Pending Amt</div>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalPendingAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4" /> Total Deposits</div>
              <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalDeposits)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="h-4 w-4" /> Transactions</div>
              <p className="text-2xl font-bold text-foreground mt-1">{allTransactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><AlertTriangle className="h-4 w-4" /> Fraud Alerts</div>
              <p className="text-2xl font-bold text-destructive mt-1">{fraudAlerts.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Monthly Deposits vs Withdrawals</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, undefined]}
                  />
                  <Bar dataKey="deposits" name="Deposits" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trades" name="Trades" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Net Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Type Distribution */}
        {typeDistribution.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Transaction Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {typeDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, undefined]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="withdrawals">
            <TabsList>
              <TabsTrigger value="withdrawals" className="gap-1">
                <ArrowUpFromLine className="h-4 w-4" /> Withdrawals
                {pendingWithdrawals.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">{pendingWithdrawals.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="transactions">All Transactions</TabsTrigger>
              <TabsTrigger value="fraud">Fraud Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="withdrawals">
              <Card>
                <CardHeader><CardTitle className="text-lg">Withdrawal Requests</CardTitle></CardHeader>
                <ScrollArea className="max-h-[500px]">
                  {withdrawalRequests.length === 0 ? (
                    <CardContent className="text-center text-muted-foreground p-8">No withdrawal requests</CardContent>
                  ) : (
                    <div className="divide-y divide-border">
                      {withdrawalRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{req.username}</p>
                              {getStatusBadge(req.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {req.withdrawal_method === 'upi' ? 'UPI' : 'Bank Transfer'} • {format(new Date(req.created_at), 'dd MMM yyyy, HH:mm')}
                            </p>
                            {req.admin_notes && <p className="text-xs text-muted-foreground mt-1">Notes: {req.admin_notes}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-foreground">₹{req.amount.toLocaleString('en-IN')}</span>
                            {req.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="default" className="h-8 gap-1" onClick={() => setReviewDialog({ open: true, id: req.id, action: 'approve' })}>
                                  <CheckCircle className="h-3 w-3" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => setReviewDialog({ open: true, id: req.id, action: 'reject' })}>
                                  <XCircle className="h-3 w-3" /> Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader><CardTitle className="text-lg">All User Transactions</CardTitle></CardHeader>
                <ScrollArea className="max-h-[500px]">
                  {allTransactions.length === 0 ? (
                    <CardContent className="text-center text-muted-foreground p-8">No transactions</CardContent>
                  ) : (
                    <div className="divide-y divide-border">
                      {allTransactions.map(txn => (
                        <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-foreground">{txn.username}</p>
                            <p className="text-xs text-muted-foreground">{txn.description || txn.type}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), 'dd MMM yyyy, HH:mm')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(txn.status)}
                            <span className={cn("font-mono font-semibold text-sm", txn.type === 'deposit' ? 'text-success' : 'text-destructive')}>
                              ₹{txn.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="fraud">
              <Card>
                <CardHeader><CardTitle className="text-lg">Fraud Alerts</CardTitle></CardHeader>
                <ScrollArea className="max-h-[500px]">
                  {fraudAlerts.length === 0 ? (
                    <CardContent className="text-center text-muted-foreground p-8">No fraud alerts</CardContent>
                  ) : (
                    <div className="divide-y divide-border">
                      {fraudAlerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className={cn("h-5 w-5", alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-warning' : 'text-muted-foreground')} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{alert.alert_type}</p>
                              <p className="text-xs text-muted-foreground">{alert.description}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(alert.created_at), 'dd MMM yyyy, HH:mm')}</p>
                            </div>
                          </div>
                          <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Withdrawal</DialogTitle>
            <DialogDescription>Add optional notes for this decision</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Admin notes (optional)" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            <Button className="w-full" variant={reviewDialog.action === 'approve' ? 'default' : 'destructive'} onClick={handleReview}>
              {reviewDialog.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
