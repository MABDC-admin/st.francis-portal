import { useState } from 'react';
import { Monitor, Server, Smartphone, MonitorPlay, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Agent } from './types';

const osIcon = (plat: string) => {
  if (plat === 'linux') return <Server className="h-8 w-8 text-muted-foreground" />;
  if (plat === 'darwin') return <Smartphone className="h-8 w-8 text-muted-foreground" />;
  return <Monitor className="h-8 w-8 text-muted-foreground" />;
};

export const AgentCard = ({ agent, onClick, onTakeControl }: { agent: Agent; onClick: () => void; onTakeControl?: (agent: Agent) => Promise<void> }) => {
  const isOnline = agent.status === 'online';
  const [isConnecting, setIsConnecting] = useState(false);

  const handleTakeControl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTakeControl) return;
    setIsConnecting(true);
    try { await onTakeControl(agent); } finally { setIsConnecting(false); }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          {osIcon(agent.plat)}
          <span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-destructive'}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{agent.description || agent.hostname}</p>
          <p className="text-xs text-muted-foreground truncate">{agent.hostname}</p>
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{agent.operating_system}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {agent.site_name && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{agent.site_name}</Badge>
          )}
          {agent.needs_reboot && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-600">Reboot</Badge>
          )}
          {(agent.patches_pending || 0) > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Patches: {agent.patches_pending}</Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {agent.last_seen ? new Date(agent.last_seen).toLocaleString() : 'Never seen'}
        </p>
        {isOnline && onTakeControl && (
          <Button size="sm" variant="outline" className="w-full mt-1 h-7 text-xs" onClick={handleTakeControl} disabled={isConnecting}>
            {isConnecting ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Connecting...</> : <><MonitorPlay className="h-3 w-3 mr-1" /> Take Control</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
