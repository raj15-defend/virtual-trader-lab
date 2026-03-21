import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { AdminSidebar, type AdminTab } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UsersTable } from '@/components/admin/UsersTable';
import { TradesTable } from '@/components/admin/TradesTable';
import { AdminSettings } from '@/components/admin/AdminSettings';

export default function Admin() {
  const { isAdmin, loading, withdrawalRequests, allTransactions, allUsers, allTrades, refreshData } = useAdmin();
  const { alerts: fraudAlerts } = useFraudDetection();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don't have admin privileges to access this page.</p>
        </div>
      </Layout>
    );
  }

  const activeUsers = allUsers.filter(u => u.status === 'active').length;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 md:p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'trades' && 'Trade History'}
                  {activeTab === 'settings' && 'Settings'}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeTab === 'dashboard' && 'Platform overview and analytics'}
                  {activeTab === 'users' && 'Manage users, roles, and access'}
                  {activeTab === 'trades' && 'View all platform trades'}
                  {activeTab === 'settings' && 'System configuration'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshData} className="gap-1.5">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>

            {/* Content */}
            {activeTab === 'dashboard' && (
              <AdminDashboard
                allTransactions={allTransactions}
                withdrawalRequests={withdrawalRequests}
                fraudAlertCount={fraudAlerts.length}
                totalUsers={allUsers.length}
                activeUsers={activeUsers}
              />
            )}
            {activeTab === 'users' && (
              <UsersTable users={allUsers} onRefresh={refreshData} />
            )}
            {activeTab === 'trades' && (
              <TradesTable trades={allTrades} />
            )}
            {activeTab === 'settings' && (
              <AdminSettings />
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
