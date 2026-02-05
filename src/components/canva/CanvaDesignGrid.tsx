import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Image, FileText, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
  };
  urls?: {
    edit_url?: string;
    view_url?: string;
  };
  created_at?: string;
  updated_at?: string;
  owner?: {
    display_name?: string;
  };
}

interface CanvaDesignGridProps {
  type: 'designs' | 'templates';
}

export const CanvaDesignGrid = ({ type }: CanvaDesignGridProps) => {
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesigns = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-api?endpoint=/designs`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch designs');
      }

      const data = await response.json();
      setDesigns(data.items || []);
    } catch (err) {
      console.error('Error fetching designs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [type]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={fetchDesigns} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Card>
    );
  }

  if (designs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Presentation className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Designs Yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first design in Canva to see it here.
        </p>
        <Button asChild>
          <a href="https://www.canva.com/design/create" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Create in Canva
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {designs.length} design{designs.length !== 1 ? 's' : ''} found
        </p>
        <Button variant="ghost" size="sm" onClick={fetchDesigns}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {designs.map((design) => (
          <Card key={design.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
            <a
              href={design.urls?.edit_url || `https://www.canva.com/design/${design.id}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {design.thumbnail?.url ? (
                  <img
                    src={design.thumbnail.url}
                    alt={design.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{design.title || 'Untitled'}</p>
                {design.updated_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {new Date(design.updated_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
};
