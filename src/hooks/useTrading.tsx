import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade, Holding, Stock } from '@/types/trading';
import { useAuth } from './useAuth';

interface DbTrade {
  id: string;
  user_id: string;
  stock_id: string;
  trade_type: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  stocks?: {
    symbol: string;
    name: string;
  };
}

interface DbHolding {
  id: string;
  user_id: string;
  stock_id: string;
  quantity: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
  stocks?: {
    symbol: string;
    name: string;
  };
}

export const useTrading = (stocks: Stock[]) => {
  const { user, profile, updateWalletBalance } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const walletBalance = profile?.wallet_balance || 100000;

  // Fetch user trades
  const fetchTrades = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        stocks (symbol, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
      return [];
    }

    return (data as DbTrade[]).map((trade): Trade => ({
      id: trade.id,
      stockSymbol: trade.stocks?.symbol || '',
      stockName: trade.stocks?.name || '',
      type: trade.trade_type as 'BUY' | 'SELL',
      quantity: trade.quantity,
      price: Number(trade.price),
      total: Number(trade.total),
      timestamp: new Date(trade.created_at),
    }));
  }, [user]);

  // Fetch user holdings
  const fetchHoldings = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('holdings')
      .select(`
        *,
        stocks (symbol, name)
      `)
      .eq('user_id', user.id)
      .gt('quantity', 0);

    if (error) {
      console.error('Error fetching holdings:', error);
      return [];
    }

    return (data as DbHolding[]).map((holding): Holding => {
      const stock = stocks.find(s => s.symbol === holding.stocks?.symbol);
      const currentPrice = stock?.price || Number(holding.avg_buy_price);
      const totalValue = holding.quantity * currentPrice;
      const totalInvested = holding.quantity * Number(holding.avg_buy_price);
      const profitLoss = totalValue - totalInvested;
      const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

      return {
        stockSymbol: holding.stocks?.symbol || '',
        stockName: holding.stocks?.name || '',
        quantity: holding.quantity,
        avgBuyPrice: Number(holding.avg_buy_price),
        currentPrice,
        totalValue: parseFloat(totalValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
      };
    });
  }, [user, stocks]);

  // Load data when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setTrades([]);
        setHoldings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [tradesData, holdingsData] = await Promise.all([
        fetchTrades(),
        fetchHoldings(),
      ]);
      setTrades(tradesData);
      setHoldings(holdingsData);
      setLoading(false);
    };

    loadData();
  }, [user, fetchTrades, fetchHoldings]);

  // Update holdings with current stock prices
  useEffect(() => {
    if (holdings.length === 0 || stocks.length === 0) return;

    setHoldings(prevHoldings =>
      prevHoldings.map(holding => {
        const stock = stocks.find(s => s.symbol === holding.stockSymbol);
        if (!stock) return holding;

        const currentPrice = stock.price;
        const totalValue = holding.quantity * currentPrice;
        const totalInvested = holding.quantity * holding.avgBuyPrice;
        const profitLoss = totalValue - totalInvested;
        const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

        return {
          ...holding,
          currentPrice,
          totalValue: parseFloat(totalValue.toFixed(2)),
          profitLoss: parseFloat(profitLoss.toFixed(2)),
          profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        };
      })
    );
  }, [stocks]);

  // Get stock ID from symbol
  const getStockId = async (symbol: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('stocks')
      .select('id')
      .eq('symbol', symbol)
      .single();

    if (error || !data) {
      console.error('Error getting stock ID:', error);
      return null;
    }

    return data.id;
  };

  // Buy stock
  const buyStock = useCallback(async (
    symbol: string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Please login to trade' };
    }

    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) {
      return { success: false, message: 'Stock not found' };
    }

    const totalCost = stock.price * quantity;
    if (totalCost > walletBalance) {
      return { success: false, message: 'Insufficient balance' };
    }

    const stockId = await getStockId(symbol);
    if (!stockId) {
      return { success: false, message: 'Stock not found in database' };
    }

    // Create trade
    const { error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        stock_id: stockId,
        trade_type: 'BUY',
        quantity,
        price: stock.price,
        total: totalCost,
      });

    if (tradeError) {
      console.error('Error creating trade:', tradeError);
      return { success: false, message: 'Failed to execute trade' };
    }

    // Update or create holding
    const existingHolding = holdings.find(h => h.stockSymbol === symbol);
    if (existingHolding) {
      const newQuantity = existingHolding.quantity + quantity;
      const newAvgPrice = ((existingHolding.avgBuyPrice * existingHolding.quantity) + totalCost) / newQuantity;

      const { data: holdingData } = await supabase
        .from('holdings')
        .select('id')
        .eq('user_id', user.id)
        .eq('stock_id', stockId)
        .single();

      if (holdingData) {
        await supabase
          .from('holdings')
          .update({
            quantity: newQuantity,
            avg_buy_price: newAvgPrice,
          })
          .eq('id', holdingData.id);
      }
    } else {
      await supabase
        .from('holdings')
        .insert({
          user_id: user.id,
          stock_id: stockId,
          quantity,
          avg_buy_price: stock.price,
        });
    }

    // Update wallet balance
    await updateWalletBalance(walletBalance - totalCost);

    // Refresh data
    const [tradesData, holdingsData] = await Promise.all([
      fetchTrades(),
      fetchHoldings(),
    ]);
    setTrades(tradesData);
    setHoldings(holdingsData);

    return { success: true, message: `Successfully bought ${quantity} shares of ${symbol}` };
  }, [user, stocks, walletBalance, holdings, updateWalletBalance, fetchTrades, fetchHoldings]);

  // Sell stock
  const sellStock = useCallback(async (
    symbol: string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Please login to trade' };
    }

    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) {
      return { success: false, message: 'Stock not found' };
    }

    const holding = holdings.find(h => h.stockSymbol === symbol);
    if (!holding || holding.quantity < quantity) {
      return { success: false, message: 'Insufficient shares to sell' };
    }

    const stockId = await getStockId(symbol);
    if (!stockId) {
      return { success: false, message: 'Stock not found in database' };
    }

    const totalValue = stock.price * quantity;

    // Create trade
    const { error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        stock_id: stockId,
        trade_type: 'SELL',
        quantity,
        price: stock.price,
        total: totalValue,
      });

    if (tradeError) {
      console.error('Error creating trade:', tradeError);
      return { success: false, message: 'Failed to execute trade' };
    }

    // Update holding
    const newQuantity = holding.quantity - quantity;
    const { data: holdingData } = await supabase
      .from('holdings')
      .select('id')
      .eq('user_id', user.id)
      .eq('stock_id', stockId)
      .single();

    if (holdingData) {
      if (newQuantity === 0) {
        await supabase
          .from('holdings')
          .delete()
          .eq('id', holdingData.id);
      } else {
        await supabase
          .from('holdings')
          .update({ quantity: newQuantity })
          .eq('id', holdingData.id);
      }
    }

    // Update wallet balance
    await updateWalletBalance(walletBalance + totalValue);

    // Refresh data
    const [tradesData, holdingsData] = await Promise.all([
      fetchTrades(),
      fetchHoldings(),
    ]);
    setTrades(tradesData);
    setHoldings(holdingsData);

    return { success: true, message: `Successfully sold ${quantity} shares of ${symbol}` };
  }, [user, stocks, holdings, walletBalance, updateWalletBalance, fetchTrades, fetchHoldings]);

  const getPortfolioValue = useCallback(() => {
    return holdings.reduce((total, holding) => total + holding.totalValue, 0);
  }, [holdings]);

  const getTotalProfitLoss = useCallback(() => {
    return holdings.reduce((total, holding) => total + holding.profitLoss, 0);
  }, [holdings]);

  return {
    trades,
    holdings,
    walletBalance,
    loading,
    buyStock,
    sellStock,
    getPortfolioValue,
    getTotalProfitLoss,
    refreshData: async () => {
      const [tradesData, holdingsData] = await Promise.all([
        fetchTrades(),
        fetchHoldings(),
      ]);
      setTrades(tradesData);
      setHoldings(holdingsData);
    },
  };
};
