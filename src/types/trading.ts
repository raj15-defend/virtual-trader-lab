export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  priceHistory: number[];
  // Fundamentals
  sector?: string;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  description?: string;
}

export interface OHLCVData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  stockSymbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  timestamp: Date;
}

export interface Holding {
  stockSymbol: string;
  stockName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  holdings: Holding[];
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  createdAt: Date;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: Date;
  balance: number;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  stockSymbol?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  publishedAt: Date;
}
