import { LayoutDashboard, Users, ArrowLeftRight, Settings, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminTab = 'dashboard' | 'users' | 'trades' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'trades', label: 'Trades', icon: ArrowLeftRight },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "h-full border-r border-border bg-card/50 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Shield className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && <span className="font-bold text-foreground text-lg">Admin</span>}
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
