import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CanvaConnectButton } from './CanvaConnectButton';
import { CanvaDesignGrid } from './CanvaDesignGrid';
import { CreateDesignDialog } from './CreateDesignDialog';

interface CanvaConnection {
  connected: boolean;
  canvaUserId?: string;
  needsRefresh?: boolean;
}

export const CanvaStudio = () => {
  const [connection, setConnection] = useState<CanvaConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('designs');

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConnection({ connected: false });
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-auth?action=status`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const status = await response.json();
        setConnection(status);
      } else {
        setConnection({ connected: false });
      }
    } catch (error) {
      console.error('Error checking Canva connection:', error);
      setConnection({ connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleDisconnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-auth`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success('Disconnected from Canva');
        setConnection({ connected: false });
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not connected state
  if (!connection?.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Palette className="h-8 w-8 text-primary" />
            Canva Design Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful designs, presentations, and more
          </p>
        </div>

        <Card className="max-w-2xl mx-auto mt-12">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Palette className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Connect Your Canva Account</CardTitle>
            <CardDescription className="text-base">
              Access your designs, templates, and create beautiful presentations directly from your school portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <CanvaConnectButton onConnected={checkConnection} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-green-100 text-green-700">✓</Badge>
                Access your existing designs
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-green-100 text-green-700">✓</Badge>
                Create from 250,000+ templates
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-green-100 text-green-700">✓</Badge>
                Build presentations & slideshows
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-green-100 text-green-700">✓</Badge>
                Export to PDF, PNG, or video
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Connected state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Palette className="h-8 w-8 text-primary" />
            Canva Design Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful designs, presentations, and more
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500 text-green-600">
            Connected
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDisconnect}>
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="designs">My Designs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <CreateDesignDialog onDesignCreated={() => {
            // Refresh designs after creating a new one
            window.location.reload();
          }} />
        </div>

        <TabsContent value="designs" className="mt-6">
          <CanvaDesignGrid type="designs" />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Browse Templates</CardTitle>
              <CardDescription>
                Explore thousands of professionally designed templates for presentations, posters, social media, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Presentations', 'Posters', 'Social Media', 'Documents', 'Videos', 'Printables', 'Marketing', 'Education'].map((category) => (
                  <a
                    key={category}
                    href={`https://www.canva.com/templates/?query=${category.toLowerCase()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center"
                  >
                    <span className="font-medium">{category}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
