import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FolderOpen, FileText, RefreshCw, AlertCircle, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';


interface Space {
  id: string;
  name: string;
  slug?: string;
}

interface Doc {
  id: string;
  title: string;
  excerpt?: string;
  created?: string;
  revised?: string;
}

export const DocumizeDashboard = () => {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [documizeUrl, setDocumizeUrl] = useState('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const callProxy = async (action: string, path?: string, query?: any) => {
    const { data: result, error } = await supabase.functions.invoke('documize-proxy', {
      body: { action, path, query },
    });
    if (error) throw error;
    return result;
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const result = await callProxy('status');
      if (result.configured === false) {
        setConfigured(false);
        return;
      }
      setConfigured(true);
      setHealthy(result.data?.healthy ?? false);
      setDocumizeUrl(result.data?.url ?? '');
    } catch {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const result = await callProxy('proxy', '/api/space');
      setSpaces(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Failed to load spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (spaceId: string) => {
    setLoading(true);
    try {
      const result = await callProxy('proxy', `/api/space/${spaceId}/documents`);
      setDocuments(Array.isArray(result.data) ? result.data : []);
      setSelectedSpace(spaceId);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkStatus(); }, []);
  useEffect(() => { if (healthy) loadSpaces(); }, [healthy]);

  const filteredDocs = documents.filter(d =>
    !searchQuery || d.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (configured === false) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Documize</h1>
          <p className="text-muted-foreground mt-1">Knowledge Base & Wiki</p>
        </motion.div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Documize Not Configured</h3>
            <p className="text-muted-foreground max-w-md">
              Set up <code className="bg-muted px-1 rounded">DOCUMIZE_URL</code> and either <code className="bg-muted px-1 rounded">DOCUMIZE_API_KEY</code> or <code className="bg-muted px-1 rounded">DOCUMIZE_USERNAME</code> + <code className="bg-muted px-1 rounded">DOCUMIZE_PASSWORD</code> secrets.
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Documize</h1>
          <p className="text-muted-foreground mt-1">Knowledge Base & Wiki</p>
        </div>
        <div className="flex gap-2">
          {documizeUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(documizeUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" /> Open Wiki
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { if (selectedSpace) loadDocuments(selectedSpace); else loadSpaces(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => { setSelectedSpace(null); setDocuments([]); }} className="text-primary hover:underline">
          Spaces
        </button>
        {selectedSpace && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">Documents</span>
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !selectedSpace ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map(space => (
            <Card key={space.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadDocuments(space.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  {space.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Click to view documents</p>
              </CardContent>
            </Card>
          ))}
          {spaces.length === 0 && (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{healthy ? 'No spaces found' : 'Server offline'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {filteredDocs.map(doc => (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => documizeUrl && window.open(`${documizeUrl}/s/${selectedSpace}/${doc.id}`, '_blank')}>
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{doc.title}</p>
                    {doc.excerpt && <p className="text-xs text-muted-foreground truncate">{doc.excerpt}</p>}
                  </div>
                  {doc.revised && (
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(doc.revised).toLocaleDateString()}</span>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredDocs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No documents found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
