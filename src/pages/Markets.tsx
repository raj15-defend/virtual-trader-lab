import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTradingContext } from '@/context/TradingContext';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stock } from '@/types/trading';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  Loader2,
  Building2,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { PriceChart } from '@/components/trading/PriceChart';

const SECTOR_ICONS: Record<string, string> = {
  IT: '💻', Banking: '🏦', Energy: '⚡', Automobile: '🚗', FMCG: '🛒',
  Pharma: '💊', Infrastructure: '🏗️', Telecom: '📡', Metals: '⛏️',
  Retail: '🛍️', Other: '🏢',
};

const Markets = () => {
  const { stocks, stocksLoading } = useTradingContext();
  const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sectors = useMemo(() => {
    const sectorSet = new Set(stocks.map((s) => s.sector || 'Other'));
    return Array.from(sectorSet).sort();
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector =
        !selectedSector || (stock.sector || 'Other') === selectedSector;
      return matchesSearch && matchesSector;
    });
  }, [stocks, searchQuery, selectedSector]);

  const groupedStocks = useMemo(() => {
    const groups: Record<string, Stock[]> = {};
    filteredStocks.forEach((stock) => {
      const sector = stock.sector || 'Other';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(stock);
    });
    return groups;
  }, [filteredStocks]);

  const sectorStats = useMemo(() => {
    return sectors.map((sector) => {
      const sectorStocks = stocks.filter((s) => (s.sector || 'Other') === sector);
      const avgChange =
        sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / (sectorStocks.length || 1);
      return { sector, count: sectorStocks.length, avgChange };
    });
  }, [stocks, sectors]);

  if (stocksLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Markets</h1>
            <p className="text-muted-foreground text-sm">
              {stocks.length} companies across {sectors.length} sectors
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedSector === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSector(null)}
            className="rounded-full"
          >
            <Filter className="h-3 w-3 mr-1" />
            All Sectors
          </Button>
          {sectorStats.map(({ sector, count, avgChange }) => (
            <Button
              key={sector}
              variant={selectedSector === sector ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
              className="rounded-full gap-1.5"
            >
              <span>{SECTOR_ICONS[sector] || '🏢'}</span>
              {sector}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Stocks Display */}
        {Object.entries(groupedStocks).map(([sector, sectorStocks]) => (
          <div key={sector} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{SECTOR_ICONS[sector] || '🏢'}</span>
              <h2 className="text-lg font-semibold text-foreground">{sector}</h2>
              <Badge variant="secondary" className="text-xs">
                {sectorStocks.length} {sectorStocks.length === 1 ? 'company' : 'companies'}
              </Badge>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sectorStocks.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    isWatchlisted={isInWatchlist(stock.id)}
                    onToggleWatchlist={() => toggleWatchlist(stock.id)}
                    onClick={() => navigate('/trade')}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Company</th>
                      <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Price</th>
                      <th className="text-right px-4 py-3 font-medium">Change</th>
                      <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Volume</th>
                      <th className="text-center px-4 py-3 font-medium w-10">★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorStocks.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate('/trade')}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground text-sm">{stock.symbol}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{stock.name}</p>
                        </td>
                        <td className="text-right px-4 py-3 font-mono text-sm text-foreground hidden sm:table-cell">
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right px-4 py-3">
                          <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-right px-4 py-3 text-sm text-muted-foreground font-mono hidden md:table-cell">
                          {(stock.volume / 1000000).toFixed(1)}M
                        </td>
                        <td className="text-center px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.id); }}
                            className="text-muted-foreground hover:text-accent transition-colors"
                          >
                            <Star className={`h-4 w-4 ${isInWatchlist(stock.id) ? 'fill-accent text-accent' : ''}`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {filteredStocks.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No companies found</p>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

// Stock Card Component
const StockCard = ({
  stock,
  isWatchlisted,
  onToggleWatchlist,
  onClick,
}: {
  stock: Stock;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  onClick: () => void;
}) => {
  const isPositive = stock.change >= 0;

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground text-sm">{stock.symbol}</p>
            <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatchlist(); }}
            className="text-muted-foreground hover:text-accent transition-colors shrink-0 ml-2"
          >
            <Star className={`h-4 w-4 ${isWatchlisted ? 'fill-accent text-accent' : ''}`} />
          </button>
        </div>

        {/* Mini chart */}
        <div className="h-12">
          <PriceChart data={stock.priceHistory} isPositive={isPositive} height={48} />
        </div>

        <div className="flex items-end justify-between">
          <p className="font-mono font-semibold text-foreground text-sm">
            ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Markets;
