import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Stock } from '@/types/trading';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SectorHeatmapProps {
  stocks: Stock[];
}

const SECTOR_ICONS: Record<string, string> = {
  IT: '💻', Banking: '🏦', Energy: '⚡', Automobile: '🚗', FMCG: '🛒',
  Pharma: '💊', Infrastructure: '🏗️', Telecom: '📡', Metals: '⛏️',
  Retail: '🛍️', Other: '🏢',
};

export const SectorHeatmap = ({ stocks }: SectorHeatmapProps) => {
  const sectorData = useMemo(() => {
    const groups: Record<string, { stocks: Stock[]; avgChange: number; totalVolume: number }> = {};

    stocks.forEach((stock) => {
      const sector = stock.sector || 'Other';
      if (!groups[sector]) groups[sector] = { stocks: [], avgChange: 0, totalVolume: 0 };
      groups[sector].stocks.push(stock);
      groups[sector].totalVolume += stock.volume;
    });

    Object.keys(groups).forEach((sector) => {
      const g = groups[sector];
      g.avgChange = g.stocks.reduce((sum, s) => sum + s.changePercent, 0) / g.stocks.length;
    });

    return Object.entries(groups)
      .map(([sector, data]) => ({ sector, ...data }))
      .sort((a, b) => b.stocks.length - a.stocks.length);
  }, [stocks]);

  const maxAbsChange = useMemo(() => {
    return Math.max(1, ...sectorData.map((s) => Math.abs(s.avgChange)));
  }, [sectorData]);

  const getHeatColor = (change: number) => {
    const intensity = Math.min(Math.abs(change) / maxAbsChange, 1);
    if (change > 0.05) return `hsla(160, 84%, 39%, ${0.15 + intensity * 0.45})`;
    if (change < -0.05) return `hsla(0, 84%, 60%, ${0.15 + intensity * 0.45})`;
    return 'hsla(215, 20%, 65%, 0.1)';
  };

  const getTextColor = (change: number) => {
    if (change > 0.05) return 'text-green-400';
    if (change < -0.05) return 'text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Sector Performance</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sectorData.map((sector, i) => (
          <motion.div
            key={sector.sector}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-lg p-3 border border-border/50 transition-all hover:border-border cursor-default"
            style={{ backgroundColor: getHeatColor(sector.avgChange) }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{SECTOR_ICONS[sector.sector] || '🏢'}</span>
              <span className="text-xs font-medium text-foreground truncate">{sector.sector}</span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${getTextColor(sector.avgChange)}`}>
              {sector.avgChange > 0.05 ? (
                <TrendingUp className="h-3 w-3" />
              ) : sector.avgChange < -0.05 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{sector.stocks.length} stocks</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
