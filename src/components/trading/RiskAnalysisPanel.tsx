import { motion } from 'framer-motion';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';
import { useTradingContext } from '@/context/TradingContext';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const RiskAnalysisPanel = () => {
  const { holdings, stocks, walletBalance } = useTradingContext();
  const analysis = useRiskAnalysis(holdings, stocks, walletBalance);

  const riskConfig = {
    Low: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    Medium: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    High: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  };

  const config = riskConfig[analysis.riskLevel];
  const RiskIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Portfolio Risk Analysis
        </h3>
      </div>

      {/* Risk Score Gauge */}
      <div className={`rounded-lg ${config.bg} border ${config.border} p-4 text-center`}>
        <RiskIcon className={`h-8 w-8 ${config.color} mx-auto mb-2`} />
        <p className={`text-3xl font-bold font-mono ${config.color}`}>
          {analysis.overallScore}
        </p>
        <p className={`text-sm font-semibold ${config.color}`}>
          {analysis.riskLevel} Risk
        </p>
      </div>

      {/* Risk Factors */}
      <div className="space-y-3">
        {analysis.factors.map((factor, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-foreground">{factor.label}</span>
              <span className="text-xs font-mono text-muted-foreground">{factor.score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  factor.score > 60 ? 'bg-destructive' :
                  factor.score > 30 ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${Math.min(100, factor.score)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{factor.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
