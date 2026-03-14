import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIPrediction, AIPrediction } from '@/hooks/useAIPrediction';
import { useTradingContext } from '@/context/TradingContext';
import { Stock } from '@/types/trading';
import { Button } from '@/components/ui/button';
import { 
  Brain, TrendingUp, TrendingDown, Minus, Loader2, 
  Target, Shield, BarChart3, AlertTriangle, Sparkles 
} from 'lucide-react';

interface AIPredictionPanelProps {
  stock: Stock | null;
}

export const AIPredictionPanel = ({ stock }: AIPredictionPanelProps) => {
  const { prediction, loading, error, getPrediction } = useAIPrediction();
  const { holdings, walletBalance } = useTradingContext();
  const [hasRequested, setHasRequested] = useState(false);

  const handleAnalyze = async () => {
    if (!stock) return;
    const holding = holdings.find(h => h.stockSymbol === stock.symbol);
    setHasRequested(true);
    await getPrediction(stock, holding, walletBalance);
  };

  const directionIcon = {
    up: <TrendingUp className="h-5 w-5 text-success" />,
    down: <TrendingDown className="h-5 w-5 text-destructive" />,
    sideways: <Minus className="h-5 w-5 text-warning" />,
  };

  const recColors = {
    BUY: 'bg-success/20 text-success border-success/30',
    SELL: 'bg-destructive/20 text-destructive border-destructive/30',
    HOLD: 'bg-warning/20 text-warning border-warning/30',
  };

  const riskColors = {
    Low: 'text-success',
    Medium: 'text-warning',
    High: 'text-destructive',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Analysis
        </h3>
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={loading || !stock}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>

      {!hasRequested && !prediction && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Select a stock and click Analyze for AI-powered insights
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Recommendation Badge */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg border font-bold text-lg ${recColors[prediction.recommendation]}`}>
                {prediction.recommendation}
              </div>
              <p className="text-sm text-muted-foreground flex-1">
                {prediction.recommendationReason}
              </p>
            </div>

            {/* Prediction */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Target</span>
                </div>
                <p className="font-mono font-semibold text-foreground">
                  ₹{prediction.prediction.targetPrice?.toLocaleString('en-IN') || 'N/A'}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {directionIcon[prediction.prediction.direction]}
                  <span className="text-xs text-muted-foreground">Direction</span>
                </div>
                <p className="font-semibold text-foreground capitalize">
                  {prediction.prediction.direction}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Confidence</span>
                </div>
                <p className="font-mono font-semibold text-foreground">
                  {prediction.prediction.confidence}%
                </p>
              </div>
            </div>

            {/* Risk */}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Assessment
                </span>
                <span className={`font-bold ${riskColors[prediction.riskLevel]}`}>
                  {prediction.riskLevel} ({prediction.riskScore}/100)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    prediction.riskScore > 60 ? 'bg-destructive' :
                    prediction.riskScore > 30 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${prediction.riskScore}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {prediction.riskFactors?.map((factor, i) => (
                  <span key={i} className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                    {factor}
                  </span>
                ))}
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Technical Indicators</h4>
              <div className="grid gap-2">
                {Object.entries(prediction.technicalIndicators || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm text-foreground">{prediction.summary}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
