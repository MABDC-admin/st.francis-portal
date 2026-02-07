import { Badge } from '@/components/ui/badge';
import type { Agent } from './types';

export const AgentTable = ({ agents, loading, onSelect }: { agents: Agent[]; loading: boolean; onSelect: (a: Agent) => void }) => (
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
        {agents.map(agent => (
          <tr key={agent.agent_id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => onSelect(agent)}>
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
        {agents.length === 0 && (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{loading ? 'Loading...' : 'No devices found'}</td></tr>
        )}
      </tbody>
    </table>
  </div>
);
