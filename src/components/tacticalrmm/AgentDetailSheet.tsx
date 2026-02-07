import { useState } from 'react';
import { Monitor, Terminal, RefreshCw, ExternalLink, Cpu, HardDrive, User, Globe, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Agent } from './types';

interface Props {
  agent: Agent | null;
  open: boolean;
  onClose: () => void;
  meshUrl: string | null;
  rmmUrl: string | null;
  loading: boolean;
}

export const AgentDetailSheet = ({ agent, open, onClose, meshUrl, rmmUrl, loading }: Props) => {
  const [cmd, setCmd] = useState('');
  const [cmdOutput, setCmdOutput] = useState('');
  const [cmdLoading, setCmdLoading] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  if (!agent) return null;

  const isOnline = agent.status === 'online';

  const runCommand = async () => {
    if (!cmd.trim()) return;
    setCmdLoading(true);
    setCmdOutput('');
    try {
      const shell = agent.plat === 'windows' ? 'cmd' : 'bash';
      const { data, error } = await supabase.functions.invoke('tacticalrmm-proxy', {
        body: {
          action: 'command',
          path: `/agents/${agent.agent_id}/cmd/`,
          method: 'POST',
          body: { shell, cmd: cmd.trim(), timeout: 30 },
        },
      });
      if (error) throw error;
      setCmdOutput(data?.data || JSON.stringify(data, null, 2));
    } catch (err: any) {
      toast.error('Command failed: ' + err.message);
    } finally {
      setCmdLoading(false);
    }
  };

  const rebootAgent = async () => {
    if (!confirm(`Reboot ${agent.hostname}?`)) return;
    setRebooting(true);
    try {
      const { error } = await supabase.functions.invoke('tacticalrmm-proxy', {
        body: {
          action: 'reboot',
          path: `/agents/${agent.agent_id}/reboot/`,
          method: 'POST',
        },
      });
      if (error) throw error;
      toast.success('Reboot command sent');
    } catch (err: any) {
      toast.error('Reboot failed: ' + err.message);
    } finally {
      setRebooting(false);
    }
  };

  const openTakeControl = () => {
    if (rmmUrl && agent.agent_id) {
      window.open(`${rmmUrl}/takecontrol/${agent.agent_id}`, '_blank');
    }
  };

  const openMeshCentral = () => {
    if (meshUrl && agent.meshnode_id) {
      window.open(`${meshUrl}/#/device/${agent.meshnode_id}`, '_blank');
    } else if (meshUrl) {
      window.open(meshUrl, '_blank');
    }
  };

  const uptimeStr = agent.boot_time
    ? `Up since ${new Date(agent.boot_time * 1000).toLocaleString()}`
    : 'Unknown';

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {agent.hostname}
          </SheetTitle>
          <SheetDescription>{agent.operating_system}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Status */}
          <div className="flex gap-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>{isOnline ? 'Online' : 'Offline'}</Badge>
            {agent.needs_reboot && <Badge variant="outline" className="text-yellow-600">Needs Reboot</Badge>}
            {agent.agent_version && <Badge variant="secondary">v{agent.agent_version}</Badge>}
          </div>

          <Separator />

          {/* System Info */}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading details...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 text-sm">
              {agent.cpu_model?.[0] && (
                <div className="flex items-start gap-2">
                  <Cpu className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-all">{agent.cpu_model[0]}</span>
                </div>
              )}
              {agent.total_ram != null && (
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>RAM: {(agent.total_ram / (1024 ** 3)).toFixed(1)} GB</span>
                </div>
              )}
              {agent.public_ip && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Public IP: {agent.public_ip}</span>
                </div>
              )}
              {agent.logged_in_username && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>User: {agent.logged_in_username}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{uptimeStr}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {rmmUrl && (
              <Button size="sm" onClick={openTakeControl}>
                <ExternalLink className="h-4 w-4 mr-1" /> Take Control
              </Button>
            )}
            {meshUrl && (
              <Button size="sm" variant="outline" onClick={openMeshCentral}>
                <ExternalLink className="h-4 w-4 mr-1" /> {agent.meshnode_id ? 'MeshCentral' : 'Open MeshCentral'}
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={rebootAgent} disabled={rebooting || !isOnline}>
              <RefreshCw className={`h-4 w-4 mr-1 ${rebooting ? 'animate-spin' : ''}`} /> Reboot
            </Button>
          </div>

          <Separator />

          {/* Run Command */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1"><Terminal className="h-4 w-4" /> Run Command</p>
            <div className="flex gap-2">
              <Input
                placeholder={agent.plat === 'windows' ? 'e.g. ipconfig' : 'e.g. uname -a'}
                value={cmd}
                onChange={e => setCmd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runCommand()}
                disabled={!isOnline}
              />
              <Button size="sm" onClick={runCommand} disabled={cmdLoading || !isOnline}>
                {cmdLoading ? 'Running...' : 'Run'}
              </Button>
            </div>
            {cmdOutput && (
              <pre className="bg-muted p-3 rounded text-xs max-h-48 overflow-auto whitespace-pre-wrap break-all">
                {cmdOutput}
              </pre>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
