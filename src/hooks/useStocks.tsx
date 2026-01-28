import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Stock, OHLCVData } from '@/types/trading';

interface DbStock {
  id: string;
  symbol: string;
  name: string;
  sector: string | null;
  market_cap: number | null;
  pe_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useStocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [ohlcvData, setOhlcvData] = useState<Record<string, OHLCVData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stocks from database
  const fetchStocks = useCallback(async () => {
    const { data, error } = await supabase
      .from('stocks')
      .select('*');

    if (error) {
      console.error('Error fetching stocks:', error);
      setError(error.message);
      return [];
    }

    return (data as DbStock[]).map((stock): Stock => ({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      price: getBasePrice(stock.symbol),
      change: 0,
      changePercent: 0,
      high: stock.fifty_two_week_high || getBasePrice(stock.symbol),
      low: stock.fifty_two_week_low || getBasePrice(stock.symbol) * 0.8,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      priceHistory: generatePriceHistory(getBasePrice(stock.symbol)),
      sector: stock.sector || undefined,
      marketCap: stock.market_cap || undefined,
      peRatio: stock.pe_ratio || undefined,
      eps: stock.eps || undefined,
      dividendYield: stock.dividend_yield || undefined,
      fiftyTwoWeekHigh: stock.fifty_two_week_high || undefined,
      fiftyTwoWeekLow: stock.fifty_two_week_low || undefined,
      description: stock.description || undefined,
    }));
  }, []);

  // Generate initial OHLCV data for a stock
  const generateOHLCVData = useCallback((basePrice: number, days: number = 30): OHLCVData[] => {
    const data: OHLCVData[] = [];
    let currentPrice = basePrice * 0.95;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const volatility = 0.02;
      const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * currentPrice;
      const low = Math.min(open, close) - Math.random() * volatility * currentPrice;
      const volume = Math.floor(Math.random() * 5000000) + 1000000;

      data.push({
        timestamp: date,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      });

      currentPrice = close;
    }

    return data;
  }, []);

  useEffect(() => {
    const loadStocks = async () => {
      setLoading(true);
      const stockData = await fetchStocks();
      setStocks(stockData);

      // Generate OHLCV data for each stock
      const ohlcv: Record<string, OHLCVData[]> = {};
      stockData.forEach(stock => {
        ohlcv[stock.symbol] = generateOHLCVData(stock.price);
      });
      setOhlcvData(ohlcv);

      setLoading(false);
    };

    loadStocks();
  }, [fetchStocks, generateOHLCVData]);

  // Simulate real-time price updates
  useEffect(() => {
    if (stocks.length === 0) return;

    const interval = setInterval(() => {
      setStocks(prevStocks =>
        prevStocks.map(stock => {
          const volatility = 0.015;
          const randomChange = (Math.random() - 0.5) * 2 * volatility * stock.price;
          const newPrice = Math.max(1, stock.price + randomChange);
          const priceChange = newPrice - stock.priceHistory[0];
          const changePercent = (priceChange / stock.priceHistory[0]) * 100;

          return {
            ...stock,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(priceChange.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            high: Math.max(stock.high, newPrice),
            low: Math.min(stock.low, newPrice),
            volume: stock.volume + Math.floor(Math.random() * 10000),
            priceHistory: [...stock.priceHistory.slice(-29), newPrice],
          };
        })
      );

      // Update OHLCV for the current period
      setOhlcvData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(symbol => {
          const stock = stocks.find(s => s.symbol === symbol);
          if (stock && updated[symbol].length > 0) {
            const lastCandle = updated[symbol][updated[symbol].length - 1];
            const newClose = stock.price;
            updated[symbol][updated[symbol].length - 1] = {
              ...lastCandle,
              close: newClose,
              high: Math.max(lastCandle.high, newClose),
              low: Math.min(lastCandle.low, newClose),
              volume: lastCandle.volume + Math.floor(Math.random() * 1000),
            };
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stocks.length]);

  return {
    stocks,
    ohlcvData,
    loading,
    error,
    getStock: (symbol: string) => stocks.find(s => s.symbol === symbol),
    getOHLCV: (symbol: string) => ohlcvData[symbol] || [],
  };
};

// Helper functions
function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'RELIANCE': 2456.75,
    'TCS': 3678.90,
    'INFY': 1542.30,
    'HDFC': 1678.45,
    'ICICI': 1023.60,
    'WIPRO': 456.80,
    'TATASTEEL': 142.35,
    'BHARTIARTL': 1234.50,
  };
  return prices[symbol] || 1000;
}

function generatePriceHistory(basePrice: number, points: number = 30): number[] {
  const history: number[] = [];
  let currentPrice = basePrice * 0.95;

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 0.02 * currentPrice;
    currentPrice = Math.max(1, currentPrice + change);
    history.push(parseFloat(currentPrice.toFixed(2)));
  }

  return history;
}
