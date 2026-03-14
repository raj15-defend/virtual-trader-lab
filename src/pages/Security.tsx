import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ActivityLogPanel } from '@/components/trading/ActivityLogPanel';
import { FraudAlertPanel } from '@/components/trading/FraudAlertPanel';
import { RiskAnalysisPanel } from '@/components/trading/RiskAnalysisPanel';
import { Shield, Lock, Eye, Fingerprint } from 'lucide-react';

const Security = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Security & Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your account security, activity logs, and fraud detection
          </p>
        </motion.div>

        {/* Security Features Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <Lock className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Encrypted</p>
              <p className="text-xs text-muted-foreground">All transactions secured</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Monitored</p>
              <p className="text-xs text-muted-foreground">Real-time fraud detection</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <Fingerprint className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Protected</p>
              <p className="text-xs text-muted-foreground">Login attempt detection</p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants} className="space-y-6">
            <RiskAnalysisPanel />
            <FraudAlertPanel />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ActivityLogPanel />
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Security;
