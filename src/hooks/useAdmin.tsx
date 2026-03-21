import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AdminWithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  withdrawal_method: string;
  account_details: Record<string, string>;
  status: string;
  admin_notes: string | null;
  created_at: string;
  username?: string;
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  description: string | null;
  created_at: string;
  username?: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  username: string;
  wallet_balance: number;
  status: string;
  created_at: string;
  role?: string;
}

export interface AdminTrade {
  id: string;
  user_id: string;
  stock_id: string;
  trade_type: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  username?: string;
  stock_name?: string;
  stock_symbol?: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<AdminWithdrawalRequest[]>([]);
  const [allTransactions, setAllTransactions] = useState<AdminTransaction[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [allTrades, setAllTrades] = useState<AdminTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = useCallback(async () => {
    if (!user) { setIsAdmin(false); return; }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');
    setIsAdmin((data?.length || 0) > 0);
  }, [user]);

  const fetchWithdrawalRequests = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', req.user_id)
            .maybeSingle();
          return { ...req, username: profile?.username || 'Unknown' } as AdminWithdrawalRequest;
        })
      );
      setWithdrawalRequests(enriched);
    }
  }, [isAdmin]);

  const fetchAllTransactions = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (txn) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', txn.user_id)
            .maybeSingle();
          return { ...txn, username: profile?.username || 'Unknown' } as AdminTransaction;
        })
      );
      setAllTransactions(enriched);
    }
  }, [isAdmin]);

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (profiles) {
      const users: AdminUser[] = profiles.map((p: any) => {
        const userRole = roles?.find((r: any) => r.user_id === p.user_id && r.role === 'admin');
        return {
          id: p.id,
          user_id: p.user_id,
          username: p.username,
          wallet_balance: p.wallet_balance,
          status: p.status || 'active',
          created_at: p.created_at,
          role: userRole ? 'admin' : 'user',
        };
      });
      setAllUsers(users);
    }
  }, [isAdmin]);

  const fetchAllTrades = useCallback(async () => {
    if (!isAdmin) return;
    const { data: trades } = await supabase
      .from('trades')
      .select('*, stocks(name, symbol)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (trades) {
      const enriched = await Promise.all(
        trades.map(async (t: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', t.user_id)
            .maybeSingle();
          return {
            ...t,
            username: profile?.username || 'Unknown',
            stock_name: t.stocks?.name || '',
            stock_symbol: t.stocks?.symbol || '',
          } as AdminTrade;
        })
      );
      setAllTrades(enriched);
    }
  }, [isAdmin]);

  useEffect(() => {
    checkAdminRole().then(() => setLoading(false));
  }, [checkAdminRole]);

  useEffect(() => {
    if (isAdmin) {
      fetchWithdrawalRequests();
      fetchAllTransactions();
      fetchAllUsers();
      fetchAllTrades();
    }
  }, [isAdmin, fetchWithdrawalRequests, fetchAllTransactions, fetchAllUsers, fetchAllTrades]);

  const approveWithdrawal = useCallback(async (requestId: string, notes?: string) => {
    if (!user || !isAdmin) return;
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        admin_notes: notes || 'Approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (!error) {
      toast.success('Withdrawal approved');
      await fetchWithdrawalRequests();
    }
  }, [user, isAdmin, fetchWithdrawalRequests]);

  const rejectWithdrawal = useCallback(async (requestId: string, notes?: string) => {
    if (!user || !isAdmin) return;
    const request = withdrawalRequests.find(r => r.id === requestId);
    if (request) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', request.user_id)
        .maybeSingle();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ wallet_balance: profile.wallet_balance + request.amount })
          .eq('user_id', request.user_id);
      }
    }

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        admin_notes: notes || 'Rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (!error) {
      toast.success('Withdrawal rejected, funds refunded');
      await fetchWithdrawalRequests();
    }
  }, [user, isAdmin, withdrawalRequests, fetchWithdrawalRequests]);

  const refreshData = useCallback(() => {
    fetchWithdrawalRequests();
    fetchAllTransactions();
    fetchAllUsers();
    fetchAllTrades();
  }, [fetchWithdrawalRequests, fetchAllTransactions, fetchAllUsers, fetchAllTrades]);

  return {
    isAdmin,
    loading,
    withdrawalRequests,
    allTransactions,
    allUsers,
    allTrades,
    approveWithdrawal,
    rejectWithdrawal,
    refreshData,
  };
};
