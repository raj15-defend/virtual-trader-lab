import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export const useActivityLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const logActivity = useCallback(async (action: string, details: Record<string, unknown> = {}) => {
    if (!user) return;
    try {
      await supabase.from('activity_logs' as any).insert({
        user_id: user.id,
        action,
        details,
      } as any);
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('activity_logs' as any)
      .select('id, action, details, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    setLogs((data as unknown as ActivityLog[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, logActivity, fetchLogs };
};
