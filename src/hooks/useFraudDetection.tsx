import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FraudAlert {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  resolved: boolean;
  created_at: string;
}

export const useFraudDetection = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const checkForFraud = useCallback(async (
    tradeType: string,
    amount: number,
    stockSymbol: string
  ) => {
    if (!user) return;

    const fraudChecks: { type: string; severity: string; description: string }[] = [];

    // Check 1: Large transaction (>50% of wallet)
    if (amount > 50000) {
      fraudChecks.push({
        type: 'large_transaction',
        severity: 'high',
        description: `Large ${tradeType} order of ₹${amount.toLocaleString('en-IN')} for ${stockSymbol}`,
      });
    }

    // Check 2: Rapid trading (more than 10 trades in last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', fiveMinAgo);

    if ((count || 0) >= 10) {
      fraudChecks.push({
        type: 'rapid_trading',
        severity: 'medium',
        description: `Rapid trading detected: ${count} trades in last 5 minutes`,
      });
    }

    // Insert fraud alerts
    for (const check of fraudChecks) {
      await supabase.from('fraud_alerts' as any).insert({
        user_id: user.id,
        alert_type: check.type,
        severity: check.severity,
        description: check.description,
      } as any);
    }

    if (fraudChecks.length > 0) {
      await fetchAlerts();
    }

    return fraudChecks.length > 0;
  }, [user]);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('fraud_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setAlerts((data as FraudAlert[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, loading, checkForFraud, fetchAlerts };
};
