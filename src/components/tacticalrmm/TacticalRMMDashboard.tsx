import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, RefreshCw, AlertCircle, CheckCircle, XCircle, AlertTriangle, Shield, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Agent {
  agent_id: string;
  hostname: string;
  operating_system: string;
  status: string;
  last_seen: string;
  plat: string;
  needs_reboot: boolean;
  patches_pending: number;
}

export const TacticalRMMDashboard = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const callProxy = async (action: string, path?: string) => {
    const { data: result, error } = await supabase.functions.invoke('tacticalrmm-proxy', {
      body: { action, path },
    });
    if (error) throw error;
    return result;
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      const result = await callProxy('list', '/agents/');
      if (result.configured === false) {
        setConfigured(false);
        return;
      }
      setConfigured(true);
      const agentList = Array.isArray(result.data) ? result.data : [];
      setAgents(agentList);
    } catch (err: any) {
      toast.error('Failed to load agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAgents(); }, []);

  const onlineAgents = agents.filter(a => a.status === 'online');
  const offlineAgents = agents.filter(a => a.status !== 'online');
  const needsReboot = agents.filter(a => a.needs_reboot);

  const filteredAgents = agents.filter(a =>
    !searchQuery || a.hostname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.operating_system?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Tactical RMM</h1>
          <p className="text-muted-foreground mt-1">Remote Monitoring & Management</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAgents}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{agents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-2xl font-bold">{onlineAgents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-2xl font-bold">{offlineAgents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Reboot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-2xl font-bold">{needsReboot.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search devices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="border rounded-lg overflow-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hostname</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">OS</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Last Seen</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(agent => (
                <tr key={agent.agent_id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2">
                    {agent.status === 'online' ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">Online</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Offline</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{agent.hostname}</td>
                  <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{agent.operating_system}</td>
                  <td className="px-4 py-2 text-muted-foreground">{agent.last_seen ? new Date(agent.last_seen).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {agent.needs_reboot && <Badge variant="outline" className="text-xs text-yellow-600">Reboot</Badge>}
                      {(agent.patches_pending || 0) > 0 && <Badge variant="outline" className="text-xs">Patches: {agent.patches_pending}</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAgents.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{loading ? 'Loading...' : 'No devices found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
