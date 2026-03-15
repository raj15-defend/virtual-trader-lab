import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) { setWatchlist([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('stock_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setWatchlist(data.map((w) => w.stock_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  const toggleWatchlist = useCallback(async (stockId: string) => {
    if (!user) { toast.error('Please log in first'); return; }
    const isIn = watchlist.includes(stockId);
    if (isIn) {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('stock_id', stockId);
      if (!error) {
        setWatchlist((prev) => prev.filter((id) => id !== stockId));
        toast.success('Removed from watchlist');
      }
    } else {
      const { error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, stock_id: stockId });
      if (!error) {
        setWatchlist((prev) => [...prev, stockId]);
        toast.success('Added to watchlist');
      }
    }
  }, [user, watchlist]);

  const isInWatchlist = useCallback((stockId: string) => watchlist.includes(stockId), [watchlist]);

  return { watchlist, loading, toggleWatchlist, isInWatchlist, refetch: fetchWatchlist };
};
