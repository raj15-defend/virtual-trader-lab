import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, Bell, Lock } from 'lucide-react';

export function AdminSettings() {
  const configs = [
    { icon: Shield, title: 'Role-Based Access', desc: 'Admin and User roles with RLS policies', status: 'Active' },
    { icon: Database, title: 'Database', desc: 'PostgreSQL with Lovable Cloud backend', status: 'Connected' },
    { icon: Bell, title: 'Notifications', desc: 'In-app + Twilio SMS + Email alerts', status: 'Configured' },
    { icon: Lock, title: 'Security', desc: 'Encryption, fraud detection, login monitoring', status: 'Enabled' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Settings</CardTitle>
          <CardDescription>System configuration and integrations overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configs.map(cfg => (
            <div key={cfg.title} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <cfg.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cfg.title}</p>
                  <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-success/30 text-success text-xs">{cfg.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
