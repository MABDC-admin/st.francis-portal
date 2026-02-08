import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Monitor, RefreshCw, AlertCircle, Users, Signal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const OMADA_API_BASE = 'https://api.mabdc.org/api/omada';

export const OmadaDashboard = () => {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${OMADA_API_BASE}/sites`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setHealthy(true);
      setSites(Array.isArray(data) ? data : data?.result?.data || data?.data || []);
    } catch (err: any) {
      console.error('Omada API error:', err);
      setHealthy(false);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkStatus(); }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Omada Controller</h1>
          <p className="text-muted-foreground mt-1">Network Management</p>
        </div>
        <Button variant="outline" size="sm" onClick={checkStatus}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Controller Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : healthy ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-200"><Wifi className="h-3 w-3 mr-1" /> Connected</Badge>
            ) : (
              <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" /> Disconnected</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sites.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Signal className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{healthy ? 'All systems nominal' : 'Controller unreachable'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {sites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sites Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sites.map((site: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-primary" />
                    <span className="font-medium">{site.name || `Site ${idx + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{site.connectedApNum || 0} APs</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && healthy && sites.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connected to Omada</h3>
            <p className="text-muted-foreground">Controller is online. No sites data available yet.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !healthy && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cannot Reach API</h3>
            <p className="text-muted-foreground max-w-md">
              Unable to connect to <code className="bg-muted px-1 rounded">api.mabdc.org</code>. Check if the API is online.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
