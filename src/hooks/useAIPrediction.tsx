import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Stock, Holding } from '@/types/trading';

export interface AIPrediction {
  prediction: {
    direction: 'up' | 'down' | 'sideways';
    confidence: number;
    targetPrice: number;
    timeframe: string;
  };
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  recommendationReason: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskFactors: string[];
  technicalIndicators: {
    movingAverage: string;
    rsi: string;
    trend: string;
  };
  summary: string;
}

export const useAIPrediction = () => {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (
    stock: Stock,
    holdings?: Holding,
    walletBalance?: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-predict', {
        body: {
          stockSymbol: stock.symbol,
          priceHistory: stock.priceHistory,
          currentPrice: stock.price,
          holdings: holdings ? { quantity: holdings.quantity, avgBuyPrice: holdings.avgBuyPrice } : null,
          walletBalance,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setPrediction(data as AIPrediction);
      return data as AIPrediction;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to get AI prediction';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { prediction, loading, error, getPrediction };
};
