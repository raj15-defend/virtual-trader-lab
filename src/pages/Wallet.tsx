import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Plus, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, XCircle, CreditCard, Smartphone, Building2, TrendingUp, TrendingDown, IndianRupee, Zap, ShieldCheck, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useWallet } from '@/hooks/useWallet';
import { useOTP } from '@/hooks/useOTP';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const paymentMethods = [
  { id: 'upi_gpay', label: 'Google Pay (UPI)', icon: Smartphone, category: 'UPI' },
  { id: 'upi_phonepe', label: 'PhonePe (UPI)', icon: Smartphone, category: 'UPI' },
  { id: 'upi_paytm', label: 'Paytm (UPI)', icon: Smartphone, category: 'UPI' },
  { id: 'debit_card', label: 'Debit Card', icon: CreditCard, category: 'Card' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, category: 'Card' },
  { id: 'net_banking', label: 'Net Banking', icon: Building2, category: 'Banking' },
];

const quickAmounts = [500, 1000, 5000, 10000, 25000, 50000];
const HIGH_VALUE_THRESHOLD = 50000;

export default function Wallet() {
  const { balance, transactions, withdrawals, loading, addFunds, requestWithdrawal } = useWallet();
  const { profile, user } = useAuth();
  const { otpSending, otpVerifying, otpSent, otpVerified, sendOTP, verifyOTP, resetOTP } = useOTP();
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [otpValue, setOtpValue] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  // Withdrawal form
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('upi');
  const [wdUpiId, setWdUpiId] = useState('');
  const [wdAccountNo, setWdAccountNo] = useState('');
  const [wdIfsc, setWdIfsc] = useState('');
  // OTP step for withdrawal
  const [wdStep, setWdStep] = useState<'form' | 'otp'>('form');

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const paymentAmount = searchParams.get('amount');
    if (paymentStatus === 'success' && paymentAmount) {
      const amt = parseFloat(paymentAmount);
      addFunds(amt, 'Stripe (Card)').then(() => {
        toast.success(`₹${amt.toLocaleString('en-IN')} added via Stripe!`);
      });
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled');
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleStripePayment = async () => {
    if (!amount) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-wallet-payment', {
        body: { amount: parseFloat(amount) },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || !selectedMethod) return;
    const amt = parseFloat(amount);

    // High-value transaction requires OTP
    if (amt >= HIGH_VALUE_THRESHOLD && !otpVerified) {
      if (!profile?.phone_number) {
        setPhoneDialogOpen(true);
        toast.info('Please add your phone number for OTP verification');
        return;
      }
      if (!otpSent) {
        await sendOTP();
        return;
      }
      return; // Wait for OTP entry
    }

    setProcessing(true);
    const method = paymentMethods.find(m => m.id === selectedMethod);
    await addFunds(amt, method?.label || selectedMethod);
    setProcessing(false);
    setAddMoneyOpen(false);
    setAmount('');
    setSelectedMethod('');
    resetOTP();
  };

  const handleVerifyAndAdd = async () => {
    const verified = await verifyOTP(otpValue);
    if (verified) {
      setOtpValue('');
      // Proceed with add funds
      setProcessing(true);
      const method = paymentMethods.find(m => m.id === selectedMethod);
      await addFunds(parseFloat(amount), method?.label || selectedMethod);
      setProcessing(false);
      setAddMoneyOpen(false);
      setAmount('');
      setSelectedMethod('');
      resetOTP();
    }
  };

  const handleWithdrawStep = async () => {
    if (!wdAmount) return;
    if (!profile?.phone_number) {
      setPhoneDialogOpen(true);
      toast.info('Please add your phone number for OTP verification');
      return;
    }
    const sent = await sendOTP();
    if (sent) {
      setWdStep('otp');
    }
  };

  const handleWithdrawVerify = async () => {
    const verified = await verifyOTP(otpValue);
    if (verified) {
      setProcessing(true);
      const details = wdMethod === 'upi'
        ? { upi_id: wdUpiId }
        : { account_number: wdAccountNo, ifsc: wdIfsc };
      await requestWithdrawal(parseFloat(wdAmount), wdMethod, details);
      setProcessing(false);
      setWithdrawOpen(false);
      setWdAmount('');
      setWdUpiId('');
      setWdAccountNo('');
      setWdIfsc('');
      setWdStep('form');
      setOtpValue('');
      resetOTP();
    }
  };

  const handleSavePhone = async () => {
    if (!phoneInput || !/^\+\d{10,15}$/.test(phoneInput)) {
      toast.error('Enter a valid phone number in E.164 format (e.g., +919876543210)');
      return;
    }
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ phone_number: phoneInput } as any)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to save phone number');
    } else {
      toast.success('Phone number saved!');
      setPhoneDialogOpen(false);
      // Refresh profile
      window.location.reload();
    }
  };

  const deposits = transactions.filter(t => t.type === 'deposit');
  const tradeTransactions = transactions.filter(t => t.type === 'trade_buy' || t.type === 'trade_sell');
  const totalDeposited = deposits.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').reduce((s, w) => s + w.amount, 0);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
      completed: { variant: 'default', icon: CheckCircle },
      approved: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'secondary', icon: Clock },
      rejected: { variant: 'destructive', icon: XCircle },
      failed: { variant: 'destructive', icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    if (type === 'deposit') return <ArrowDownToLine className="h-4 w-4 text-success" />;
    if (type === 'withdrawal') return <ArrowUpFromLine className="h-4 w-4 text-destructive" />;
    if (type === 'trade_buy') return <TrendingUp className="h-4 w-4 text-success" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const showOtpForAdd = parseFloat(amount || '0') >= HIGH_VALUE_THRESHOLD && otpSent && !otpVerified;

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <WalletIcon className="h-7 w-7 text-primary" /> My Wallet
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your funds, deposits, and withdrawals</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setPhoneInput(profile?.phone_number || '');
              setPhoneDialogOpen(true);
            }}
          >
            <Phone className="h-4 w-4" />
            {profile?.phone_number ? 'Update Phone' : 'Add Phone'}
          </Button>
        </motion.div>

        {/* Balance Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-foreground mt-1 flex items-center gap-1">
                <IndianRupee className="h-6 w-6" />
                {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => setAddMoneyOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Money
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setWithdrawOpen(true); setWdStep('form'); resetOTP(); setOtpValue(''); }} className="gap-1">
                  <ArrowUpFromLine className="h-4 w-4" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Deposited</p>
              <p className="text-2xl font-bold text-success mt-1">
                ₹{totalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{deposits.length} deposits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-2xl font-bold text-destructive mt-1">
                ₹{totalWithdrawn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{withdrawals.length} requests</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TransactionList transactions={transactions} getTypeIcon={getTypeIcon} getStatusBadge={getStatusBadge} />
            </TabsContent>
            <TabsContent value="deposits">
              <TransactionList transactions={deposits} getTypeIcon={getTypeIcon} getStatusBadge={getStatusBadge} />
            </TabsContent>
            <TabsContent value="withdrawals">
              <WithdrawalList withdrawals={withdrawals} getStatusBadge={getStatusBadge} />
            </TabsContent>
            <TabsContent value="trades">
              <TransactionList transactions={tradeTransactions} getTypeIcon={getTypeIcon} getStatusBadge={getStatusBadge} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Add Money Dialog */}
      <Dialog open={addMoneyOpen} onOpenChange={(open) => { setAddMoneyOpen(open); if (!open) { resetOTP(); setOtpValue(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Add Money</DialogTitle>
            <DialogDescription>Choose a payment method and enter amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} />
              <div className="flex flex-wrap gap-2 mt-2">
                {quickAmounts.map(qa => (
                  <Button key={qa} variant="outline" size="sm" onClick={() => setAmount(String(qa))}>
                    ₹{qa.toLocaleString('en-IN')}
                  </Button>
                ))}
              </div>
              {parseFloat(amount || '0') >= HIGH_VALUE_THRESHOLD && (
                <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  OTP verification required for transactions ≥ ₹{HIGH_VALUE_THRESHOLD.toLocaleString('en-IN')}
                </p>
              )}
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethods.map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedMethod(pm.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors",
                        selectedMethod === pm.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OTP Section for high-value */}
            {showOtpForAdd && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-primary/20">
                <Label className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" /> Enter OTP
                </Label>
                <p className="text-xs text-muted-foreground">A 6-digit code was sent to your phone</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button className="w-full" disabled={otpValue.length !== 6 || otpVerifying} onClick={handleVerifyAndAdd}>
                  {otpVerifying ? 'Verifying...' : 'Verify & Add Funds'}
                </Button>
                <Button variant="ghost" size="sm" className="w-full" disabled={otpSending} onClick={() => sendOTP()}>
                  Resend OTP
                </Button>
              </div>
            )}

            {!showOtpForAdd && (
              <>
                <Button
                  className="w-full"
                  disabled={!amount || !selectedMethod || processing || otpSending}
                  onClick={handleAddFunds}
                >
                  {otpSending ? 'Sending OTP...' : processing ? 'Processing...' : `Add ₹${amount ? parseFloat(amount).toLocaleString('en-IN') : '0'} ${parseFloat(amount || '0') >= HIGH_VALUE_THRESHOLD ? '(OTP Required)' : '(Simulated)'}`}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or pay with</span></div>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 hover:bg-primary/5"
                  disabled={!amount || processing}
                  onClick={handleStripePayment}
                >
                  <Zap className="h-4 w-4 text-primary" />
                  {processing ? 'Redirecting to Stripe...' : `Pay ₹${amount ? parseFloat(amount).toLocaleString('en-IN') : '0'} with Stripe`}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog with OTP */}
      <Dialog open={withdrawOpen} onOpenChange={(open) => { setWithdrawOpen(open); if (!open) { setWdStep('form'); resetOTP(); setOtpValue(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowUpFromLine className="h-5 w-5 text-primary" /> Withdraw Funds</DialogTitle>
            <DialogDescription>
              {wdStep === 'form' ? 'All withdrawals require OTP verification and admin approval' : 'Enter the OTP sent to your phone'}
            </DialogDescription>
          </DialogHeader>

          {wdStep === 'form' ? (
            <div className="space-y-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="Enter amount" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} min={1} max={balance} />
                <p className="text-xs text-muted-foreground mt-1">Available: ₹{balance.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <Label>Withdrawal Method</Label>
                <Select value={wdMethod} onValueChange={setWdMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {wdMethod === 'upi' ? (
                <div>
                  <Label>UPI ID</Label>
                  <Input placeholder="name@upi" value={wdUpiId} onChange={(e) => setWdUpiId(e.target.value)} />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Account Number</Label>
                    <Input placeholder="Account number" value={wdAccountNo} onChange={(e) => setWdAccountNo(e.target.value)} />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input placeholder="IFSC code" value={wdIfsc} onChange={(e) => setWdIfsc(e.target.value)} />
                  </div>
                </>
              )}
              <Button
                className="w-full gap-2"
                disabled={!wdAmount || parseFloat(wdAmount) > balance || otpSending}
                onClick={handleWithdrawStep}
              >
                <ShieldCheck className="h-4 w-4" />
                {otpSending ? 'Sending OTP...' : 'Verify & Submit'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-primary/20 space-y-3">
                <p className="text-sm text-muted-foreground">Withdrawing <span className="font-bold text-foreground">₹{parseFloat(wdAmount || '0').toLocaleString('en-IN')}</span> via {wdMethod === 'upi' ? 'UPI' : 'Bank Transfer'}</p>
                <Label className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" /> Enter OTP
                </Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button className="w-full" disabled={otpValue.length !== 6 || otpVerifying || processing} onClick={handleWithdrawVerify}>
                {otpVerifying ? 'Verifying...' : processing ? 'Processing...' : 'Confirm Withdrawal'}
              </Button>
              <Button variant="ghost" size="sm" className="w-full" disabled={otpSending} onClick={() => sendOTP()}>
                Resend OTP
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Phone Number Dialog */}
      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Phone Number</DialogTitle>
            <DialogDescription>Add your phone number for OTP verification and SMS alerts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Phone Number (E.164 format)</Label>
              <Input
                placeholder="+919876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +91 for India)</p>
            </div>
            <Button className="w-full" onClick={handleSavePhone} disabled={!phoneInput}>
              Save Phone Number
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function TransactionList({ transactions, getTypeIcon, getStatusBadge }: {
  transactions: any[];
  getTypeIcon: (type: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  if (transactions.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">No transactions yet</CardContent></Card>
    );
  }
  return (
    <Card>
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-border">
          {transactions.map(txn => (
            <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                {getTypeIcon(txn.type)}
                <div>
                  <p className="text-sm font-medium text-foreground">{txn.description || txn.type}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(txn.status)}
                <span className={cn(
                  "font-mono font-semibold text-sm",
                  txn.type === 'deposit' || txn.type === 'trade_sell' ? 'text-success' : 'text-destructive'
                )}>
                  {txn.type === 'deposit' || txn.type === 'trade_sell' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

function WithdrawalList({ withdrawals, getStatusBadge }: {
  withdrawals: any[];
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  if (withdrawals.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">No withdrawal requests</CardContent></Card>
    );
  }
  return (
    <Card>
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-border">
          {withdrawals.map(wd => (
            <div key={wd.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Withdrawal via {wd.withdrawal_method}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(wd.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(wd.status)}
                <span className="font-mono font-semibold text-sm text-destructive">
                  -₹{wd.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
