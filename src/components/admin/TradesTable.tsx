import { useState, useMemo } from 'react';
import { Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AdminTrade {
  id: string;
  user_id: string;
  stock_id: string;
  trade_type: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  username?: string;
  stock_name?: string;
  stock_symbol?: string;
}

interface Props {
  trades: AdminTrade[];
}

export function TradesTable({ trades }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return trades.filter(t => {
      const matchSearch =
        (t.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.stock_symbol || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.stock_name || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || t.trade_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [trades, search, typeFilter]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">All Trades</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by user or stock..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No trades found</TableCell></TableRow>
            ) : (
              filtered.map(trade => (
                <TableRow key={trade.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{trade.username || 'Unknown'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">{trade.stock_symbol || '—'}</p>
                      <p className="text-xs text-muted-foreground">{trade.stock_name || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs gap-1", trade.trade_type === 'buy' ? 'border-success/30 text-success' : 'border-destructive/30 text-destructive')}>
                      {trade.trade_type === 'buy' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {trade.trade_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{trade.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{trade.price.toLocaleString('en-IN')}</TableCell>
                  <TableCell className={cn("text-right font-mono text-sm font-semibold", trade.trade_type === 'buy' ? 'text-success' : 'text-destructive')}>
                    ₹{trade.total.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{format(new Date(trade.created_at), 'dd MMM yyyy')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
