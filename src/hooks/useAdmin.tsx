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

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<AdminWithdrawalRequest[]>([]);
  const [allTransactions, setAllTransactions] = useState<AdminTransaction[]>([]);
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
      .from('withdrawal_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch usernames for each request
      const enriched = await Promise.all(
        (data as unknown as AdminWithdrawalRequest[]).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', req.user_id)
            .maybeSingle();
          return { ...req, username: profile?.username || 'Unknown' };
        })
      );
      setWithdrawalRequests(enriched);
    }
  }, [isAdmin]);

  const fetchAllTransactions = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('wallet_transactions' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      const enriched = await Promise.all(
        (data as unknown as AdminTransaction[]).map(async (txn) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', txn.user_id)
            .maybeSingle();
          return { ...txn, username: profile?.username || 'Unknown' };
        })
      );
      setAllTransactions(enriched);
    }
  }, [isAdmin]);

  useEffect(() => {
    checkAdminRole().then(() => setLoading(false));
  }, [checkAdminRole]);

  useEffect(() => {
    if (isAdmin) {
      fetchWithdrawalRequests();
      fetchAllTransactions();
    }
  }, [isAdmin, fetchWithdrawalRequests, fetchAllTransactions]);

  const approveWithdrawal = useCallback(async (requestId: string, notes?: string) => {
    if (!user || !isAdmin) return;
    const { error } = await supabase
      .from('withdrawal_requests' as any)
      .update({
        status: 'approved',
        admin_notes: notes || 'Approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', requestId);

    if (!error) {
      toast.success('Withdrawal approved');
      await fetchWithdrawalRequests();
    }
  }, [user, isAdmin, fetchWithdrawalRequests]);

  const rejectWithdrawal = useCallback(async (requestId: string, notes?: string) => {
    if (!user || !isAdmin) return;
    
    // Get the request details to refund
    const request = withdrawalRequests.find(r => r.id === requestId);
    if (request) {
      // Refund the held amount
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
      .from('withdrawal_requests' as any)
      .update({
        status: 'rejected',
        admin_notes: notes || 'Rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', requestId);

    if (!error) {
      toast.success('Withdrawal rejected, funds refunded');
      await fetchWithdrawalRequests();
    }
  }, [user, isAdmin, withdrawalRequests, fetchWithdrawalRequests]);

  return {
    isAdmin,
    loading,
    withdrawalRequests,
    allTransactions,
    approveWithdrawal,
    rejectWithdrawal,
    refreshData: () => { fetchWithdrawalRequests(); fetchAllTransactions(); },
  };
};
