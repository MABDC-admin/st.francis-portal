import { Badge } from '@/components/ui/badge';
import type { Agent } from './types';

export const AgentTable = ({ agents, loading, onSelect }: { agents: Agent[]; loading: boolean; onSelect: (a: Agent) => void }) => (
  <div className="border rounded-lg overflow-auto max-h-[500px]">
    <table className="w-full text-sm">
      <thead className="bg-teal-600 text-white sticky top-0">
        <tr>
          <th className="px-4 py-2 text-left font-semibold text-white">Status</th>
          <th className="px-4 py-2 text-left font-semibold text-white">Name</th>
          <th className="px-4 py-2 text-left font-semibold text-white">Site</th>
          <th className="px-4 py-2 text-left font-semibold text-white">OS</th>
          <th className="px-4 py-2 text-left font-semibold text-white">Last Seen</th>
          <th className="px-4 py-2 text-left font-semibold text-white">Flags</th>
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-800/30">
        {agents.map(agent => (
          <tr key={agent.agent_id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => onSelect(agent)}>
            <td className="px-4 py-2">
              {agent.status === 'online' ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">Online</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Offline</Badge>
              )}
            </td>
            <td className="px-4 py-2">
              <p className="font-medium">{agent.description || agent.hostname}</p>
              <p className="text-xs text-muted-foreground">{agent.hostname}</p>
            </td>
            <td className="px-4 py-2 text-muted-foreground">{agent.site_name || '-'}</td>
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
          <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{loading ? 'Loading...' : 'No devices found'}</td></tr>
        )}
      </tbody>
    </table>
  </div>
);
