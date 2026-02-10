import { useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CanvaConnectButtonProps {
  onConnected?: () => void;
}

export const CanvaConnectButton = ({ onConnected: _onConnected }: CanvaConnectButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Current URL as redirect URI (for OAuth callback)
      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const { data, error } = await supabase.functions.invoke(`canva-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}`, {
        method: 'GET',
      });

      if (error) throw error;

      if (data?.configured === false) {
        toast.error('Canva is not configured. Please set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET.');
        return;
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Connect error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Canva');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Palette className="h-5 w-5 mr-2" />
          Connect with Canva
        </>
      )}
    </Button>
  );
};
