import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Stock, Trade, Holding, User, WalletTransaction } from '@/types/trading';
import { INITIAL_STOCKS, INITIAL_WALLET_BALANCE } from '@/data/stocks';

interface TradingContextType {
  user: User | null;
  stocks: Stock[];
  trades: Trade[];
  holdings: Holding[];
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  buyStock: (symbol: string, quantity: number) => { success: boolean; message: string };
  sellStock: (symbol: string, quantity: number) => { success: boolean; message: string };
  getPortfolioValue: () => number;
  getTotalProfitLoss: () => number;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return context;
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [walletBalance, setWalletBalance] = useState(INITIAL_WALLET_BALANCE);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);

  // Simulate price movements
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const volatility = 0.02;
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
            priceHistory: [...stock.priceHistory.slice(-29), newPrice],
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update holdings with current prices
  useEffect(() => {
    setHoldings((prevHoldings) =>
      prevHoldings.map((holding) => {
        const stock = stocks.find((s) => s.symbol === holding.stockSymbol);
        if (!stock) return holding;

        const currentPrice = stock.price;
        const totalValue = holding.quantity * currentPrice;
        const totalInvested = holding.quantity * holding.avgBuyPrice;
        const profitLoss = totalValue - totalInvested;
        const profitLossPercent = (profitLoss / totalInvested) * 100;

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

  const login = useCallback((username: string, password: string): boolean => {
    // Simple validation - in production, this would be an API call
    if (username.length >= 3 && password.length >= 6) {
      const storedUser = localStorage.getItem(`user_${username}`);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.password === password) {
          setUser(userData.user);
          setWalletBalance(userData.walletBalance || INITIAL_WALLET_BALANCE);
          setHoldings(userData.holdings || []);
          setTrades(userData.trades || []);
          setWalletTransactions(userData.walletTransactions || []);
          return true;
        }
      }
      return false;
    }
    return false;
  }, []);

  const register = useCallback((username: string, email: string, password: string): boolean => {
    if (username.length >= 3 && email.includes('@') && password.length >= 6) {
      const existingUser = localStorage.getItem(`user_${username}`);
      if (existingUser) {
        return false;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        username,
        email,
        walletBalance: INITIAL_WALLET_BALANCE,
        createdAt: new Date(),
      };

      const initialTransaction: WalletTransaction = {
        id: crypto.randomUUID(),
        type: 'CREDIT',
        amount: INITIAL_WALLET_BALANCE,
        description: 'Welcome bonus - Demo trading funds',
        timestamp: new Date(),
        balance: INITIAL_WALLET_BALANCE,
      };

      localStorage.setItem(`user_${username}`, JSON.stringify({
        user: newUser,
        password,
        walletBalance: INITIAL_WALLET_BALANCE,
        holdings: [],
        trades: [],
        walletTransactions: [initialTransaction],
      }));

      setUser(newUser);
      setWalletBalance(INITIAL_WALLET_BALANCE);
      setWalletTransactions([initialTransaction]);
      setHoldings([]);
      setTrades([]);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    if (user) {
      localStorage.setItem(`user_${user.username}`, JSON.stringify({
        user,
        password: localStorage.getItem(`user_${user.username}`) 
          ? JSON.parse(localStorage.getItem(`user_${user.username}`)!).password 
          : '',
        walletBalance,
        holdings,
        trades,
        walletTransactions,
      }));
    }
    setUser(null);
    setWalletBalance(INITIAL_WALLET_BALANCE);
    setHoldings([]);
    setTrades([]);
    setWalletTransactions([]);
  }, [user, walletBalance, holdings, trades, walletTransactions]);

  const buyStock = useCallback((symbol: string, quantity: number): { success: boolean; message: string } => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) {
      return { success: false, message: 'Stock not found' };
    }

    const totalCost = stock.price * quantity;
    if (totalCost > walletBalance) {
      return { success: false, message: 'Insufficient balance' };
    }

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      stockSymbol: symbol,
      stockName: stock.name,
      type: 'BUY',
      quantity,
      price: stock.price,
      total: totalCost,
      timestamp: new Date(),
    };

    const newTransaction: WalletTransaction = {
      id: crypto.randomUUID(),
      type: 'DEBIT',
      amount: totalCost,
      description: `Bought ${quantity} shares of ${symbol}`,
      timestamp: new Date(),
      balance: walletBalance - totalCost,
    };

    setTrades((prev) => [newTrade, ...prev]);
    setWalletTransactions((prev) => [newTransaction, ...prev]);
    setWalletBalance((prev) => prev - totalCost);

    setHoldings((prev) => {
      const existingHolding = prev.find((h) => h.stockSymbol === symbol);
      if (existingHolding) {
        const newQuantity = existingHolding.quantity + quantity;
        const newAvgPrice = ((existingHolding.avgBuyPrice * existingHolding.quantity) + totalCost) / newQuantity;
        return prev.map((h) =>
          h.stockSymbol === symbol
            ? {
                ...h,
                quantity: newQuantity,
                avgBuyPrice: parseFloat(newAvgPrice.toFixed(2)),
                totalValue: parseFloat((newQuantity * stock.price).toFixed(2)),
              }
            : h
        );
      } else {
        return [...prev, {
          stockSymbol: symbol,
          stockName: stock.name,
          quantity,
          avgBuyPrice: stock.price,
          currentPrice: stock.price,
          totalValue: parseFloat(totalCost.toFixed(2)),
          profitLoss: 0,
          profitLossPercent: 0,
        }];
      }
    });

    return { success: true, message: `Successfully bought ${quantity} shares of ${symbol}` };
  }, [stocks, walletBalance]);

  const sellStock = useCallback((symbol: string, quantity: number): { success: boolean; message: string } => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) {
      return { success: false, message: 'Stock not found' };
    }

    const holding = holdings.find((h) => h.stockSymbol === symbol);
    if (!holding || holding.quantity < quantity) {
      return { success: false, message: 'Insufficient shares to sell' };
    }

    const totalValue = stock.price * quantity;

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      stockSymbol: symbol,
      stockName: stock.name,
      type: 'SELL',
      quantity,
      price: stock.price,
      total: totalValue,
      timestamp: new Date(),
    };

    const newTransaction: WalletTransaction = {
      id: crypto.randomUUID(),
      type: 'CREDIT',
      amount: totalValue,
      description: `Sold ${quantity} shares of ${symbol}`,
      timestamp: new Date(),
      balance: walletBalance + totalValue,
    };

    setTrades((prev) => [newTrade, ...prev]);
    setWalletTransactions((prev) => [newTransaction, ...prev]);
    setWalletBalance((prev) => prev + totalValue);

    setHoldings((prev) => {
      const newQuantity = holding.quantity - quantity;
      if (newQuantity === 0) {
        return prev.filter((h) => h.stockSymbol !== symbol);
      }
      return prev.map((h) =>
        h.stockSymbol === symbol
          ? {
              ...h,
              quantity: newQuantity,
              totalValue: parseFloat((newQuantity * stock.price).toFixed(2)),
            }
          : h
      );
    });

    return { success: true, message: `Successfully sold ${quantity} shares of ${symbol}` };
  }, [stocks, holdings, walletBalance]);

  const getPortfolioValue = useCallback(() => {
    return holdings.reduce((total, holding) => total + holding.totalValue, 0);
  }, [holdings]);

  const getTotalProfitLoss = useCallback(() => {
    return holdings.reduce((total, holding) => total + holding.profitLoss, 0);
  }, [holdings]);

  return (
    <TradingContext.Provider
      value={{
        user,
        stocks,
        trades,
        holdings,
        walletBalance,
        walletTransactions,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        buyStock,
        sellStock,
        getPortfolioValue,
        getTotalProfitLoss,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};
