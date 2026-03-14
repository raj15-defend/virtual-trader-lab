import { motion } from 'framer-motion';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const severityConfig = {
  low: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  medium: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  high: { icon: AlertOctagon, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
};

export const FraudAlertPanel = () => {
  const { alerts, loading, fetchAlerts } = useFraudDetection();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          Security Alerts
          {alerts.filter(a => !a.resolved).length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              {alerts.filter(a => !a.resolved).length}
            </span>
          )}
        </h3>
        <Button variant="ghost" size="icon" onClick={fetchAlerts} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="h-[250px]">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <ShieldAlert className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No security alerts</p>
            <p className="text-xs text-muted-foreground">Your account activity looks normal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;
              const Icon = config.icon;
              const time = new Date(alert.created_at);

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg ${config.bg} border ${config.border} p-3`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${config.color} capitalize`}>
                        {alert.alert_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {time.toLocaleDateString('en-IN')} {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};
