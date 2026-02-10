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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RMMClient {
  id: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'warning';
  last_seen: string;
  os: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: string;
  location?: string;
}

const SECURITY_QUESTION = "What is your favorite fruit?";
const SECURITY_ANSWER = "banana";

export default function RMM() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [clients, setClients] = useState<RMMClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has admin access
  useEffect(() => {
    if (!user || !hasRole('admin')) {
      navigate('/');
      return;
    }
  }, [user, hasRole, navigate]);

  // Mock data for RMM clients (in real implementation, this would come from Tactical RMM API)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in real implementation, fetch from Tactical RMM
        const mockClients: RMMClient[] = [
          {
            id: '1',
            hostname: 'WORKSTATION-001',
            ip: '192.168.1.101',
            status: 'online',
            last_seen: new Date().toISOString(),
            os: 'Windows 11 Pro',
            cpu_usage: 24,
            memory_usage: 67,
            disk_usage: 45,
            uptime: '5 days, 3 hours',
            location: 'Main Office'
          },
          {
            id: '2',
            hostname: 'SERVER-PRIMARY',
            ip: '192.168.1.10',
            status: 'online',
            last_seen: new Date().toISOString(),
            os: 'Ubuntu 22.04 LTS',
            cpu_usage: 12,
            memory_usage: 34,
            disk_usage: 78,
            uptime: '42 days, 12 hours',
            location: 'Server Room'
          },
          {
            id: '3',
            hostname: 'LAPTOP-TEACHER01',
            ip: '192.168.1.156',
            status: 'warning',
            last_seen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            os: 'macOS Sonoma',
            cpu_usage: 89,
            memory_usage: 92,
            disk_usage: 23,
            uptime: '2 days, 18 hours',
            location: 'Faculty Lounge'
          },
          {
            id: '4',
            hostname: 'CLASSROOM-PC05',
            ip: '192.168.1.205',
            status: 'offline',
            last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            os: 'Windows 10 Pro',
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 67,
            uptime: '0 days',
            location: 'Classroom 5'
          }
        ];
        
        setClients(mockClients);
        setError(null);
      } catch (err) {
        setError('Failed to fetch RMM client data');
        console.error('RMM fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
    // Set up polling for real-time updates
    const interval = setInterval(fetchClients, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityAnswer.toLowerCase().trim() === SECURITY_ANSWER.toLowerCase()) {
      setIsAuthenticated(true);
      toast.success('Access granted to RMM dashboard');
    } else {
      toast.error('Incorrect security answer');
      setSecurityAnswer('');
    }
  };

  const getStatusIcon = (status: RMMClient['status']) => {
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

  const getStatusBadge = (status: RMMClient['status']) => {
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
              RMM Security Verification
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
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Tactical RMM Dashboard</h1>
              <p className="text-slate-400">Remote monitoring and management of all connected clients</p>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {clients.filter(c => c.status === 'online').length}
                    </p>
                    <p className="text-sm text-slate-400">Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {clients.filter(c => c.status === 'warning').length}
                    </p>
                    <p className="text-sm text-slate-400">Warnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {clients.filter(c => c.status === 'offline').length}
                    </p>
                    <p className="text-sm text-slate-400">Offline</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-white">{clients.length}</p>
                    <p className="text-sm text-slate-400">Total Clients</p>
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
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
              <p className="text-red-300">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(client.status)}
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          {client.hostname}
                          {getStatusBadge(client.status)}
                        </CardTitle>
                        <p className="text-sm text-slate-400">{client.ip}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300">{client.os}</span>
                  </div>
                  
                  {client.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300">{client.location}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-300">CPU</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {client.cpu_usage}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-300">Memory</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {client.memory_usage}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-slate-300">Disk</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {client.disk_usage}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Last seen: {new Date(client.last_seen).toLocaleTimeString()}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {client.uptime}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}