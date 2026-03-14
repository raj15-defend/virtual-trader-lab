import { useMemo } from 'react';
import { Holding, Stock } from '@/types/trading';

export interface RiskAnalysis {
  overallScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  diversificationScore: number;
  volatilityScore: number;
  concentrationRisk: number;
  factors: { label: string; score: number; description: string }[];
}

export const useRiskAnalysis = (holdings: Holding[], stocks: Stock[], walletBalance: number) => {
  const analysis = useMemo((): RiskAnalysis => {
    if (holdings.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'Low',
        diversificationScore: 100,
        volatilityScore: 0,
        concentrationRisk: 0,
        factors: [{ label: 'No positions', score: 0, description: 'No active investments' }],
      };
    }

    const totalPortfolio = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalValue = totalPortfolio + walletBalance;
    const factors: { label: string; score: number; description: string }[] = [];

    // 1. Concentration risk (largest position as % of portfolio)
    const maxPosition = Math.max(...holdings.map(h => h.totalValue));
    const concentrationRisk = totalPortfolio > 0 ? (maxPosition / totalPortfolio) * 100 : 0;
    factors.push({
      label: 'Concentration Risk',
      score: Math.min(100, concentrationRisk),
      description: concentrationRisk > 50
        ? 'High concentration in single stock'
        : concentrationRisk > 30
        ? 'Moderate diversification'
        : 'Well diversified',
    });

    // 2. Diversification (number of stocks)
    const diversificationScore = Math.max(0, 100 - (holdings.length >= 5 ? 0 : (5 - holdings.length) * 20));
    factors.push({
      label: 'Diversification',
      score: 100 - diversificationScore,
      description: `${holdings.length} stock${holdings.length > 1 ? 's' : ''} in portfolio`,
    });

    // 3. Volatility (based on price changes)
    const avgVolatility = holdings.reduce((sum, h) => {
      const stock = stocks.find(s => s.symbol === h.stockSymbol);
      return sum + Math.abs(stock?.changePercent || 0);
    }, 0) / holdings.length;
    const volatilityScore = Math.min(100, avgVolatility * 10);
    factors.push({
      label: 'Volatility',
      score: volatilityScore,
      description: `Average ${avgVolatility.toFixed(1)}% daily movement`,
    });

    // 4. Portfolio exposure (% of total value invested)
    const exposurePercent = totalValue > 0 ? (totalPortfolio / totalValue) * 100 : 0;
    factors.push({
      label: 'Market Exposure',
      score: exposurePercent,
      description: `${exposurePercent.toFixed(0)}% of total value invested`,
    });

    // 5. Loss exposure
    const totalLoss = holdings.filter(h => h.profitLoss < 0).reduce((sum, h) => sum + Math.abs(h.profitLoss), 0);
    const lossExposure = totalPortfolio > 0 ? (totalLoss / totalPortfolio) * 100 : 0;
    factors.push({
      label: 'Unrealized Losses',
      score: Math.min(100, lossExposure * 2),
      description: lossExposure > 0 ? `₹${totalLoss.toLocaleString('en-IN')} in losses` : 'No unrealized losses',
    });

    const overallScore = Math.round(
      factors.reduce((sum, f) => sum + f.score, 0) / factors.length
    );

    return {
      overallScore,
      riskLevel: overallScore > 60 ? 'High' : overallScore > 30 ? 'Medium' : 'Low',
      diversificationScore,
      volatilityScore,
      concentrationRisk,
      factors,
    };
  }, [holdings, stocks, walletBalance]);

  return analysis;
};
