import React, { createContext, useContext } from 'react';
import { Stock, Trade, Holding, OHLCVData, MarketNews } from '@/types/trading';
import { useAuth } from '@/hooks/useAuth';
import { useStocks } from '@/hooks/useStocks';
import { useTrading } from '@/hooks/useTrading';
import { useMarketNews } from '@/hooks/useMarketNews';

interface TradingContextType {
  // Auth
  user: { id: string; username: string; email: string } | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  
  // Stocks
  stocks: Stock[];
  stocksLoading: boolean;
  getStock: (symbol: string) => Stock | undefined;
  getOHLCV: (symbol: string) => OHLCVData[];
  
  // Trading
  trades: Trade[];
  holdings: Holding[];
  walletBalance: number;
  tradingLoading: boolean;
  buyStock: (symbol: string, quantity: number) => Promise<{ success: boolean; message: string }>;
  sellStock: (symbol: string, quantity: number) => Promise<{ success: boolean; message: string }>;
  getPortfolioValue: () => number;
  getTotalProfitLoss: () => number;
  
  // News
  news: MarketNews[];
  newsLoading: boolean;
  getNewsByStock: (symbol: string) => MarketNews[];
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
  const auth = useAuth();
  const { stocks, ohlcvData, loading: stocksLoading, getStock, getOHLCV } = useStocks();
  const trading = useTrading(stocks);
  const { news, loading: newsLoading, getNewsByStock } = useMarketNews();

  const user = auth.profile 
    ? {
        id: auth.user?.id || '',
        username: auth.profile.username,
        email: auth.user?.email || '',
      }
    : null;

  return (
    <TradingContext.Provider
      value={{
        // Auth
        user,
        isAuthenticated: !!auth.user,
        authLoading: auth.loading,
        signIn: auth.signIn,
        signUp: auth.signUp,
        signOut: auth.signOut,
        
        // Stocks
        stocks,
        stocksLoading,
        getStock,
        getOHLCV,
        
        // Trading
        trades: trading.trades,
        holdings: trading.holdings,
        walletBalance: trading.walletBalance,
        tradingLoading: trading.loading,
        buyStock: trading.buyStock,
        sellStock: trading.sellStock,
        getPortfolioValue: trading.getPortfolioValue,
        getTotalProfitLoss: trading.getTotalProfitLoss,
        
        // News
        news,
        newsLoading,
        getNewsByStock,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};
