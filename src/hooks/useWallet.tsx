import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'rejected';
  payment_method: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  withdrawal_method: string;
  account_details: Record<string, string>;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user, profile, updateWalletBalance } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions((data as unknown as WalletTransaction[]) || []);
    setLoading(false);
  }, [user]);

  const fetchWithdrawals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setWithdrawals((data as unknown as WithdrawalRequest[]) || []);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
    fetchWithdrawals();
  }, [fetchTransactions, fetchWithdrawals]);

  const addFunds = useCallback(async (amount: number, paymentMethod: string) => {
    if (!user || !profile) return { success: false, message: 'Not authenticated' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newBalance = profile.wallet_balance + amount;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      await supabase.from('wallet_transactions' as any).insert({
        user_id: user.id,
        type: 'deposit',
        amount,
        status: 'completed',
        payment_method: paymentMethod,
        description: `Added ₹${amount.toLocaleString('en-IN')} via ${paymentMethod}`,
        reference_id: `TXN${Date.now()}`,
      } as any);

      // Create notification
      await supabase.from('notifications' as any).insert({
        user_id: user.id,
        title: 'Funds Added',
        message: `₹${amount.toLocaleString('en-IN')} added to your wallet via ${paymentMethod}`,
        type: 'success',
      } as any);

      await updateWalletBalance(newBalance);
      await fetchTransactions();
      
      // Trigger SMS notification (fire-and-forget)
      supabase.functions.invoke('send-sms', {
        body: {
          to: '+919999999999', // placeholder - would be user's phone
          message: `₹${amount.toLocaleString('en-IN')} added to your TradeSim wallet via ${paymentMethod}. New balance: ₹${newBalance.toLocaleString('en-IN')}`,
          type: 'deposit',
        },
      }).catch(() => {}); // Non-blocking

      toast.success(`₹${amount.toLocaleString('en-IN')} added successfully!`);
      return { success: true, message: 'Funds added successfully' };
    } catch (error: any) {
      toast.error('Failed to add funds');
      return { success: false, message: error.message };
    }
  }, [user, profile, updateWalletBalance, fetchTransactions]);

  const requestWithdrawal = useCallback(async (
    amount: number,
    method: string,
    accountDetails: Record<string, string>
  ) => {
    if (!user || !profile) return { success: false, message: 'Not authenticated' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };
    if (amount > profile.wallet_balance) return { success: false, message: 'Insufficient balance' };

    try {
      // Deduct from wallet immediately (hold)
      const newBalance = profile.wallet_balance - amount;
      await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', user.id);

      await supabase.from('withdrawal_requests' as any).insert({
        user_id: user.id,
        amount,
        withdrawal_method: method,
        account_details: accountDetails,
        status: 'pending',
      } as any);

      await supabase.from('wallet_transactions' as any).insert({
        user_id: user.id,
        type: 'withdrawal',
        amount,
        status: 'pending',
        payment_method: method,
        description: `Withdrawal of ₹${amount.toLocaleString('en-IN')} via ${method}`,
        reference_id: `WD${Date.now()}`,
      } as any);

      await supabase.from('notifications' as any).insert({
        user_id: user.id,
        title: 'Withdrawal Requested',
        message: `Withdrawal of ₹${amount.toLocaleString('en-IN')} is pending admin approval`,
        type: 'info',
      } as any);

      await updateWalletBalance(newBalance);
      await fetchTransactions();
      await fetchWithdrawals();
      toast.success('Withdrawal request submitted!');
      return { success: true, message: 'Withdrawal request submitted' };
    } catch (error: any) {
      toast.error('Failed to submit withdrawal');
      return { success: false, message: error.message };
    }
  }, [user, profile, updateWalletBalance, fetchTransactions, fetchWithdrawals]);

  return {
    balance: profile?.wallet_balance || 0,
    transactions,
    withdrawals,
    loading,
    addFunds,
    requestWithdrawal,
    refreshTransactions: fetchTransactions,
    refreshWithdrawals: fetchWithdrawals,
  };
};
