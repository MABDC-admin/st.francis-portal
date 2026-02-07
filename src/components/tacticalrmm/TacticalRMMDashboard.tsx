import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle, XCircle, AlertTriangle, Search, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgentCard } from './AgentCard';
import { AgentTable } from './AgentTable';
import { AgentDetailSheet } from './AgentDetailSheet';
import type { Agent, ViewMode, StatusFilter } from './types';

export const TacticalRMMDashboard = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('online');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [meshUrl, setMeshUrl] = useState<string | null>(null);
  const [rmmUrl, setRmmUrl] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('tacticalrmm-proxy', {
        body: { action: 'list', path: '/agents/' },
      });
      if (error) { toast.error('Failed to connect to Tactical RMM'); return; }
      if (result?.configured === false) { setConfigured(false); return; }
      setConfigured(true);
      if (result?.meshUrl) setMeshUrl(result.meshUrl);
      if (result?.rmmUrl) setRmmUrl(result.rmmUrl);
      if (result?.error) { toast.error(result.error); return; }
      setAgents(Array.isArray(result?.data) ? result.data : []);
    } catch { toast.error('Failed to load agents'); }
    finally { setLoading(false); }
  };

  const openAgentDetail = async (agent: Agent) => {
    setSelectedAgent(agent);
    setDetailLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('tacticalrmm-proxy', {
        body: { action: 'detail', path: `/agents/${agent.agent_id}/` },
      });
      if (!error && result?.data) {
        setSelectedAgent(prev => prev ? { ...prev, ...result.data } : prev);
      }
    } catch { /* keep basic info */ }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { loadAgents(); }, []);

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const offlineCount = agents.filter(a => a.status !== 'online').length;
  const rebootCount = agents.filter(a => a.needs_reboot).length;

  const sites = [...new Set(agents.map(a => a.site_name).filter(Boolean))] as string[];

  const filtered = agents.filter(a => {
    if (statusFilter === 'online' && a.status !== 'online') return false;
    if (statusFilter === 'offline' && a.status === 'online') return false;
    if (statusFilter === 'reboot' && !a.needs_reboot) return false;
    if (siteFilter !== 'all' && a.site_name !== siteFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.hostname?.toLowerCase().includes(q) || a.operating_system?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    }
    return true;
  });

  if (configured === false) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Tactical RMM</h1>
          <p className="text-muted-foreground mt-1">Remote Monitoring & Management</p>
        </motion.div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tactical RMM Not Configured</h3>
            <p className="text-muted-foreground max-w-md">
              Set up <code className="bg-muted px-1 rounded">TACTICALRMM_URL</code> and <code className="bg-muted px-1 rounded">TACTICALRMM_API_KEY</code> secrets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Tactical RMM</h1>
          <p className="text-muted-foreground mt-1">Remote Monitoring & Management</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAgents}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: agents.length, icon: null },
          { label: 'Online', value: onlineCount, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
          { label: 'Offline', value: offlineCount, icon: <XCircle className="h-5 w-5 text-destructive" /> },
          { label: 'Needs Reboot', value: rebootCount, icon: <AlertTriangle className="h-5 w-5 text-yellow-500" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2">{s.icon}<p className="text-2xl font-bold">{s.value}</p></div></CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search devices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="reboot">Needs Reboot</SelectItem>
          </SelectContent>
        </Select>
        {sites.length > 0 && (
          <Select value={siteFilter} onValueChange={v => setSiteFilter(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Sites" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex border rounded-md">
          <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode('card')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode('table')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(agent => (
            <AgentCard key={agent.agent_id} agent={agent} onClick={() => openAgentDetail(agent)} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center py-8 text-muted-foreground">{loading ? 'Loading...' : 'No devices found'}</p>
          )}
        </div>
      ) : (
        <AgentTable agents={filtered} loading={loading} onSelect={openAgentDetail} />
      )}

      {/* Detail Sheet */}
      <AgentDetailSheet
        agent={selectedAgent}
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        meshUrl={meshUrl}
        rmmUrl={rmmUrl}
        loading={detailLoading}
      />
    </div>
  );
};
