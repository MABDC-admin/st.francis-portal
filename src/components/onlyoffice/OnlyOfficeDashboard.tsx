import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const OnlyOfficeDashboard = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('onlyoffice-proxy', {
        body: { action: 'status' },
      });
      if (error) throw error;
      if (result.configured === false) {
        setConfigured(false);
        return;
      }
      setConfigured(true);
      setServerHealthy(result.data?.healthy ?? false);
      setServerUrl(result.data?.url ?? '');
    } catch (err: any) {
      toast.error('Failed to check OnlyOffice status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkStatus(); }, []);

  if (configured === false) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">OnlyOffice</h1>
          <p className="text-muted-foreground mt-1">Document Editing Suite</p>
        </motion.div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">OnlyOffice Not Configured</h3>
            <p className="text-muted-foreground max-w-md">
              Please provide your OnlyOffice Document Server URL and JWT secret. Set up the <code className="bg-muted px-1 rounded">ONLYOFFICE_URL</code> and <code className="bg-muted px-1 rounded">ONLYOFFICE_JWT_SECRET</code> secrets.
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">OnlyOffice</h1>
          <p className="text-muted-foreground mt-1">Document Editing Suite</p>
        </div>
        <Button variant="outline" size="sm" onClick={checkStatus}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {loading ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : serverHealthy ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Online</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Offline</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Server URL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono truncate">{serverUrl || 'Loading...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" disabled={!serverHealthy} onClick={() => window.open(serverUrl, '_blank')}>
              <Plus className="h-4 w-4 mr-2" /> Open Editor
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Document Editing</h3>
          <p className="text-muted-foreground max-w-md">
            {serverHealthy
              ? 'Your OnlyOffice Document Server is online. Upload documents to edit them collaboratively within the dashboard.'
              : 'Server is currently offline. Please check your OnlyOffice Document Server.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
