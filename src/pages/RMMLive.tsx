import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Server, 
  Wifi, 
  WifiOff, 
  Clock, 
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  MonitorPlay
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgentCard } from '@/components/tacticalrmm/AgentCard';
import type { Agent } from '@/components/tacticalrmm/types';

const SECURITY_QUESTION = "What is your favorite fruit?";
const SECURITY_ANSWER = "banana";

export default function RMMLive() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has admin access
  useEffect(() => {
    if (!user || !hasRole('admin')) {
      navigate('/');
      return;
    }
  }, [user, hasRole, navigate]);

  // Load agents from Tactical RMM
  const loadAgents = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase.functions.invoke('tacticalrmm-proxy', {
        body: { action: 'list', path: '/agents/' },
      });
      
      if (error) {
        setError('Failed to connect to Tactical RMM');
        toast.error('Failed to fetch RMM data');
        return;
      }
      
      if (result?.configured === false) {
        setError('Tactical RMM is not configured');
        return;
      }
      
      const allAgents = Array.isArray(result?.data) ? result.data : [];
      const onlineAgents = allAgents.filter((agent: Agent) => agent.status === 'online');
      setAgents(onlineAgents);
      setFilteredAgents(onlineAgents);
    } catch (err) {
      setError('Failed to fetch RMM client data');
      console.error('RMM fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter agents based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAgents(agents);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = agents.filter(agent => 
      agent.hostname?.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query) ||
      agent.site_name?.toLowerCase().includes(query) ||
      agent.operating_system?.toLowerCase().includes(query)
    );
    setFilteredAgents(filtered);
  }, [searchQuery, agents]);

  // Initial load and polling
  useEffect(() => {
    if (!isAuthenticated) return;
    
    loadAgents();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(loadAgents, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityAnswer.toLowerCase().trim() === SECURITY_ANSWER.toLowerCase()) {
      setIsAuthenticated(true);
      toast.success('Access granted to RMM Live Dashboard');
    } else {
      toast.error('Incorrect security answer');
      setSecurityAnswer('');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAgents();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleTakeControl = async (agent: Agent) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('tacticalrmm-proxy', {
        body: { action: 'takecontrol', path: `/agents/${agent.agent_id}/meshcentral/` },
      });
      
      if (error || !result?.data?.control) {
        toast.error(result?.error || 'Failed to get remote control URL');
        return;
      }
      
      window.open(result.data.control, '_blank');
      toast.success(`Taking control of ${agent.hostname}`);
    } catch (err) {
      toast.error('Failed to connect for remote control');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (!user || !hasRole('admin')) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Shield className="h-5 w-5" />
              RMM Live Security Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="security-answer" className="text-sm font-medium">
                  {SECURITY_QUESTION}
                </Label>
                <Input
                  id="security-answer"
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  required
                  className="text-center"
                />
              </div>
              <Button type="submit" className="w-full">
                Verify Access
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">RMM Live Dashboard</h1>
              <p className="text-slate-400">Real-time monitoring of all connected clients</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search connected clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{agents.length}</p>
                    <p className="text-sm text-slate-400">Connected Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {new Set(agents.map(a => a.site_name)).size}
                    </p>
                    <p className="text-sm text-slate-400">Sites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <MonitorPlay className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{agents.filter(a => a.needs_reboot).length}</p>
                    <p className="text-sm text-slate-400">Need Reboot</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">Error Loading Data</h3>
              <p className="text-red-300 mb-6">{error}</p>
              <Button 
                onClick={loadAgents} 
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredAgents.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <WifiOff className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No matching clients found' : 'No connected clients'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'There are currently no online clients connected to Tactical RMM'
                }
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card 
                key={agent.agent_id} 
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(agent.status)}
                      <div>
                        <h3 className="font-semibold text-white truncate max-w-[180px]">
                          {agent.description || agent.hostname}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">{agent.hostname}</p>
                      </div>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <HardDrive className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 truncate">{agent.operating_system}</span>
                    </div>
                    
                    {agent.site_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-300">{agent.site_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Last seen: {agent.last_seen ? new Date(agent.last_seen).toLocaleTimeString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-slate-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => handleTakeControl(agent)}
                    >
                      <MonitorPlay className="h-4 w-4 mr-1" />
                      Take Control
                    </Button>
                  </div>
                  
                  {(agent.needs_reboot || (agent.patches_pending || 0) > 0) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                      {agent.needs_reboot && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                          Reboot Required
                        </Badge>
                      )}
                      {(agent.patches_pending || 0) > 0 && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                          {agent.patches_pending} Patches
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Data refreshes automatically every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}