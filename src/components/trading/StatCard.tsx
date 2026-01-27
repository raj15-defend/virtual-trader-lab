import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, subtitle, trend, icon, className }: StatCardProps) => {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "stat-value mt-2",
            trend === 'up' && 'text-profit',
            trend === 'down' && 'text-loss',
            trend === 'neutral' && 'text-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "mt-1 text-sm",
              trend === 'up' && 'text-profit',
              trend === 'down' && 'text-loss',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "rounded-lg p-2",
            trend === 'up' && 'bg-success/10 text-success',
            trend === 'down' && 'bg-destructive/10 text-destructive',
            trend === 'neutral' && 'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
