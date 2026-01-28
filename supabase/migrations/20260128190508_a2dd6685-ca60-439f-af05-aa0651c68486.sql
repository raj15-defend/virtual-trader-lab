-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 100000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stocks table with fundamentals
CREATE TABLE public.stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sector TEXT,
  market_cap DECIMAL(20, 2),
  pe_ratio DECIMAL(10, 2),
  eps DECIMAL(10, 2),
  dividend_yield DECIMAL(5, 2),
  fifty_two_week_high DECIMAL(15, 2),
  fifty_two_week_low DECIMAL(15, 2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_prices table for OHLCV data (candlestick)
CREATE TABLE public.stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  open_price DECIMAL(15, 2) NOT NULL,
  high_price DECIMAL(15, 2) NOT NULL,
  low_price DECIMAL(15, 2) NOT NULL,
  close_price DECIMAL(15, 2) NOT NULL,
  volume BIGINT NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holdings table for portfolio
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_buy_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- Create market_news table
CREATE TABLE public.market_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  stock_symbol TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_id UUID REFERENCES public.stocks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stocks policies (public read)
CREATE POLICY "Anyone can view stocks" ON public.stocks FOR SELECT USING (true);

-- Stock prices policies (public read)
CREATE POLICY "Anyone can view stock prices" ON public.stock_prices FOR SELECT USING (true);

-- Trades policies
CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Holdings policies
CREATE POLICY "Users can view their own holdings" ON public.holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own holdings" ON public.holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own holdings" ON public.holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own holdings" ON public.holdings FOR DELETE USING (auth.uid() = user_id);

-- Market news policies (public read)
CREATE POLICY "Anyone can view market news" ON public.market_news FOR SELECT USING (true);

-- Watchlist policies
CREATE POLICY "Users can view their own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON public.stocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON public.holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, wallet_balance)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email), 100000.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial stock data with fundamentals
INSERT INTO public.stocks (symbol, name, sector, market_cap, pe_ratio, eps, dividend_yield, fifty_two_week_high, fifty_two_week_low, description) VALUES
('RELIANCE', 'Reliance Industries', 'Energy', 1680000000000, 28.5, 86.20, 0.35, 2856.00, 2180.00, 'India''s largest conglomerate with interests in petrochemicals, refining, oil, telecommunications and retail.'),
('TCS', 'Tata Consultancy Services', 'Technology', 1380000000000, 32.8, 112.10, 1.15, 4255.00, 3056.00, 'Global leader in IT services, consulting and business solutions with operations in 150 locations.'),
('INFY', 'Infosys Limited', 'Technology', 640000000000, 28.2, 54.70, 2.25, 1890.00, 1215.00, 'Multinational corporation providing business consulting, information technology and outsourcing services.'),
('HDFC', 'HDFC Bank', 'Financial Services', 1150000000000, 22.5, 74.60, 1.05, 1795.00, 1363.00, 'India''s largest private sector bank by assets offering banking and financial services.'),
('ICICI', 'ICICI Bank', 'Financial Services', 720000000000, 18.9, 54.20, 0.85, 1280.00, 875.00, 'Leading private sector bank offering retail and corporate banking services.'),
('WIPRO', 'Wipro Limited', 'Technology', 235000000000, 24.1, 18.95, 0.45, 715.00, 385.00, 'Global information technology, consulting and business process services company.'),
('TATASTEEL', 'Tata Steel', 'Materials', 175000000000, 8.5, 16.75, 2.85, 185.00, 98.00, 'One of the world''s most geographically diversified steel producers.'),
('BHARTIARTL', 'Bharti Airtel', 'Telecommunications', 685000000000, 65.2, 18.95, 0.42, 1650.00, 815.00, 'Global telecommunications company with operations in 18 countries across Asia and Africa.');