import { useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CanvaConnectButtonProps {
  onConnected?: () => void;
}

export const CanvaConnectButton = ({ onConnected }: CanvaConnectButtonProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      // Current URL as redirect URI (for OAuth callback)
      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-auth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start authorization');
      }

      if (data.authUrl) {
        // Redirect to Canva OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Connect error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to Canva');
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
