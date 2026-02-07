import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, X, ExternalLink, Monitor, Focus, RotateCcw, MonitorUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ConnectedAgent } from './types';

interface Props {
  agents: ConnectedAgent[];
  onBack: () => void;
  onRefreshAll: () => void;
  refreshing: boolean;
}

export const LiveMonitorView = ({ agents, onBack, onRefreshAll, refreshing }: Props) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [windowStatus, setWindowStatus] = useState<Record<string, boolean>>({});
  const popupRefs = useRef<Record<string, Window | null>>({});

  const visible = agents.filter(a => !dismissed.has(a.agent_id));
  const openCount = Object.values(windowStatus).filter(Boolean).length;

  const openPopup = useCallback((agent: ConnectedAgent) => {
    if (!agent.controlUrl) return;
    const win = window.open(agent.controlUrl, `mesh_${agent.agent_id}`, 'width=1024,height=768,menubar=no,toolbar=no');
    if (win) {
      popupRefs.current[agent.agent_id] = win;
      setWindowStatus(prev => ({ ...prev, [agent.agent_id]: true }));
    }
  }, []);

  const focusPopup = useCallback((agentId: string) => {
    const win = popupRefs.current[agentId];
    if (win && !win.closed) {
      win.focus();
    }
  }, []);

  // Auto-open all on mount
  useEffect(() => {
    agents.forEach(agent => {
      if (agent.controlUrl && !agent.connectionError) {
        openPopup(agent);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for closed windows
  useEffect(() => {
    const interval = setInterval(() => {
      const updated: Record<string, boolean> = {};
      for (const [id, win] of Object.entries(popupRefs.current)) {
        updated[id] = !!win && !win.closed;
      }
      setWindowStatus(updated);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = useCallback((id: string) => {
    const win = popupRefs.current[id];
    if (win && !win.closed) win.close();
    delete popupRefs.current[id];
    setDismissed(prev => new Set(prev).add(id));
  }, []);

  const openAll = useCallback(() => {
    visible.forEach(agent => {
      if (agent.controlUrl && !agent.connectionError) {
        openPopup(agent);
      }
    });
  }, [visible, openPopup]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Live Monitor Control Panel</h1>
            <p className="text-sm text-muted-foreground">
              {openCount} windows open · {visible.length} agents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openAll}>
            <MonitorUp className="h-4 w-4 mr-1" /> Open All
          </Button>
          <Button variant="outline" size="sm" onClick={onRefreshAll} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No monitors connected</h3>
            <p className="text-muted-foreground text-sm">All monitors have been dismissed or none are available.</p>
            <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map(agent => {
            const hasError = !!agent.connectionError;
            const hasUrl = !!agent.controlUrl && !hasError;
            const isOpen = windowStatus[agent.agent_id] ?? false;

            return (
              <Card key={agent.agent_id} className="overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${agent.status === 'online' ? 'bg-green-500' : 'bg-destructive'}`} />
                    <span className="text-sm font-medium truncate">{agent.description || agent.hostname}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismiss(agent.agent_id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {hasError ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : isOpen ? (
                      <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Window Open</Badge>
                    ) : (
                      <Badge variant="secondary">Window Closed</Badge>
                    )}
                  </div>

                  {hasError && (
                    <p className="text-xs text-muted-foreground">{agent.connectionError}</p>
                  )}

                  <div className="flex gap-2">
                    {hasUrl && isOpen && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => focusPopup(agent.agent_id)}>
                        <Focus className="h-3 w-3 mr-1" /> Focus
                      </Button>
                    )}
                    {hasUrl && !isOpen && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openPopup(agent)}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                      </Button>
                    )}
                    {hasUrl && (
                      <Button size="sm" variant="ghost" onClick={() => window.open(agent.controlUrl, '_blank')}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
