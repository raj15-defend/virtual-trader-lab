import { motion } from 'framer-motion';
import { useActivityLog } from '@/hooks/useActivityLog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, LogIn, LogOut, ShoppingCart, TrendingDown, 
  UserCog, RefreshCw, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const actionIcons: Record<string, typeof Activity> = {
  login: LogIn,
  logout: LogOut,
  buy: ShoppingCart,
  sell: TrendingDown,
  profile_update: UserCog,
};

const actionColors: Record<string, string> = {
  login: 'text-success',
  logout: 'text-muted-foreground',
  buy: 'text-success',
  sell: 'text-destructive',
  profile_update: 'text-primary',
};

export const ActivityLogPanel = () => {
  const { logs, loading, fetchLogs } = useActivityLog();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Log
        </h3>
        <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || Activity;
              const color = actionColors[log.action] || 'text-muted-foreground';
              const details = log.details as Record<string, unknown>;
              const time = new Date(log.created_at);

              return (
                <div key={log.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <div className={`mt-0.5 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    {details && Object.keys(details).length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {time.toLocaleDateString('en-IN')} {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
