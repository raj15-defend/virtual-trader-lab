import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const useLoginSecurity = () => {
  const recordAttempt = useCallback(async (email: string, success: boolean) => {
    try {
      await supabase.from('login_attempts' as any).insert({
        email,
        success,
        ip_address: 'browser-client',
        user_agent: navigator.userAgent.slice(0, 200),
      } as any);
    } catch (e) {
      console.error('Failed to record login attempt:', e);
    }
  }, []);

  const checkLockout = useCallback(async (email: string): Promise<{
    locked: boolean;
    remainingMinutes: number;
    failedAttempts: number;
  }> => {
    try {
      const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
      
      const { data } = await supabase
        .from('login_attempts' as any)
        .select('success, created_at')
        .eq('email', email)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (!data) return { locked: false, remainingMinutes: 0, failedAttempts: 0 };

      const attempts = data as unknown as { success: boolean; created_at: string }[];

      // Count consecutive failures (stop at first success)
      let failedAttempts = 0;
      for (const attempt of attempts) {
        if (attempt.success) break;
        failedAttempts++;
      }

      if (failedAttempts >= MAX_ATTEMPTS) {
        const lastAttempt = new Date(attempts[0].created_at);
        const unlockTime = new Date(lastAttempt.getTime() + LOCKOUT_MINUTES * 60 * 1000);
        const remaining = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
        
        return {
          locked: remaining > 0,
          remainingMinutes: Math.max(0, remaining),
          failedAttempts,
        };
      }

      return { locked: false, remainingMinutes: 0, failedAttempts };
    } catch {
      return { locked: false, remainingMinutes: 0, failedAttempts: 0 };
    }
  }, []);

  return { recordAttempt, checkLockout };
};
