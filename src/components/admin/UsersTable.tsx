import { useState } from 'react';
import { Search, ShieldCheck, ShieldOff, Ban, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  user_id: string;
  username: string;
  wallet_balance: number;
  status: string;
  created_at: string;
  role?: string;
}

interface Props {
  users: AdminUser[];
  onRefresh: () => void;
}

export function UsersTable({ users, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; user: AdminUser | null; action: string }>({ open: false, user: null, action: '' });

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAction = async () => {
    if (!confirmDialog.user) return;
    const { user_id } = confirmDialog.user;

    try {
      if (confirmDialog.action === 'promote') {
        await supabase.from('user_roles').insert({ user_id, role: 'admin' as any });
        toast.success(`${confirmDialog.user.username} promoted to Admin`);
      } else if (confirmDialog.action === 'demote') {
        await supabase.from('user_roles').delete().eq('user_id', user_id).eq('role', 'admin' as any);
        toast.success(`${confirmDialog.user.username} demoted to User`);
      } else if (confirmDialog.action === 'block') {
        await supabase.from('profiles').update({ status: 'blocked' } as any).eq('user_id', user_id);
        toast.success(`${confirmDialog.user.username} blocked`);
      } else if (confirmDialog.action === 'unblock') {
        await supabase.from('profiles').update({ status: 'active' } as any).eq('user_id', user_id);
        toast.success(`${confirmDialog.user.username} unblocked`);
      }
      onRefresh();
    } catch {
      toast.error('Action failed');
    }
    setConfirmDialog({ open: false, user: null, action: '' });
  };

  const actionLabel: Record<string, string> = {
    promote: 'Promote to Admin',
    demote: 'Demote to User',
    block: 'Block User',
    unblock: 'Unblock User',
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">User Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
            ) : (
              filtered.map(user => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", user.status === 'active' ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive')}>
                      {user.status === 'active' ? 'Active' : 'Blocked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{user.wallet_balance.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.role !== 'admin' && (
                          <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, user, action: 'promote' })}>
                            <ShieldCheck className="h-4 w-4 mr-2" /> Promote to Admin
                          </DropdownMenuItem>
                        )}
                        {user.role === 'admin' && (
                          <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, user, action: 'demote' })}>
                            <ShieldOff className="h-4 w-4 mr-2" /> Demote to User
                          </DropdownMenuItem>
                        )}
                        {user.status === 'active' ? (
                          <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, user, action: 'block' })} className="text-destructive">
                            <Ban className="h-4 w-4 mr-2" /> Block User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, user, action: 'unblock' })}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Unblock User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to <strong>{actionLabel[confirmDialog.action]?.toLowerCase()}</strong> for <strong>{confirmDialog.user?.username}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, user: null, action: '' })}>Cancel</Button>
            <Button variant={confirmDialog.action === 'block' ? 'destructive' : 'default'} onClick={handleAction}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
