import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShieldAlert,
    MapPin,
    Clock,
    User,
    Search,
    Filter,
    Monitor,
    CheckCircle2,
    XCircle,
    MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AuditDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');

    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data;
        },
    });

    const filteredLogs = logs?.filter(log => {
        const matchesSearch =
            (log.lrn?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.action?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            'login_success': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'login_failure': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'impersonation_start': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'impersonation_stop': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'data_export': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return colors[action] || 'bg-secondary text-secondary-foreground';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                        Security Audit Logs
                    </h1>
                    <p className="text-muted-foreground">Monitor system access and critical actions across all schools.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Statuses</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('success')}>Success Only</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('failure')}>Failures Only</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="border-none shadow-premium">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Entity (LRN)</TableHead>
                                <TableHead>Location & IP</TableHead>
                                <TableHead className="hidden lg:table-cell">Device</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7} className="h-12 animate-pulse bg-muted/20" />
                                    </TableRow>
                                ))
                            ) : filteredLogs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No audit logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs?.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`${getActionBadge(log.action)} border-none text-[10px] uppercase font-bold`}>
                                                {log.action.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {log.status === 'success' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <XCircle className="h-4 w-4" />
                                                    {log.error_message && (
                                                        <span className="text-[10px] font-medium max-w-[150px] truncate">
                                                            {log.error_message}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm font-medium">{log.lrn || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs space-y-1">
                                                <div className="flex items-center gap-1 font-medium">
                                                    <MapPin className="h-3 w-3 text-primary" />
                                                    {log.city || 'Unknown'}, {log.country_code || '--'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground ml-4">
                                                    {log.ip_address}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                <span className="max-w-[200px] truncate">{log.user_agent}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
