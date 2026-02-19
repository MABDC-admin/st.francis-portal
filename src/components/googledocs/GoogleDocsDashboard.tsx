import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, ExternalLink, X, FileSpreadsheet, Presentation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleDoc {
  id: string;
  title: string;
  url: string;
  doc_type: string;
  created_at: string;
}

const docTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  document: { label: 'Document', icon: FileText, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  spreadsheet: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'bg-green-500/10 text-green-600 border-green-200' },
  presentation: { label: 'Presentation', icon: Presentation, color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
};

function extractEmbedUrl(url: string): string {
  // Convert Google Docs/Sheets/Slides URLs to embeddable format
  try {
    const u = new URL(url);
    if (u.hostname === 'docs.google.com') {
      // Remove trailing slash, ensure /edit or /preview
      const path = u.pathname.replace(/\/+$/, '');
      if (path.includes('/document/d/') || path.includes('/spreadsheets/d/') || path.includes('/presentation/d/')) {
        // Strip /edit or /preview suffix if present, then add /preview
        const base = path.replace(/\/(edit|preview|pub)$/, '');
        return `https://docs.google.com${base}/preview`;
      }
    }
  } catch {
    // fallback
  }
  return url;
}

function detectDocType(url: string): string {
  if (url.includes('/spreadsheets/')) return 'spreadsheet';
  if (url.includes('/presentation/')) return 'presentation';
  return 'document';
}

export const GoogleDocsDashboard = () => {
  const [docs, setDocs] = useState<GoogleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [docType, setDocType] = useState('document');
  const [saving, setSaving] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<GoogleDoc | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('google_docs').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load documents');
    } else {
      setDocs((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setSaving(true);
    const detected = detectDocType(url);
    const { error } = await supabase.from('google_docs').insert({
      title: title.trim(),
      url: url.trim(),
      doc_type: detected !== 'document' ? detected : docType,
    });
    if (error) {
      toast.error('Failed to add document');
    } else {
      toast.success('Document added');
      setTitle('');
      setUrl('');
      setDocType('document');
      setAddOpen(false);
      fetchDocs();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('google_docs').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document removed');
      if (viewingDoc?.id === id) setViewingDoc(null);
      fetchDocs();
    }
  };

  // Embedded viewer
  if (viewingDoc) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>
              <X className="h-4 w-4 mr-1" /> Back
            </Button>
            <h2 className="text-lg font-semibold">{viewingDoc.title}</h2>
            <Badge variant="outline" className={docTypeConfig[viewingDoc.doc_type]?.color}>
              {docTypeConfig[viewingDoc.doc_type]?.label || viewingDoc.doc_type}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(viewingDoc.url, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-1" /> Open in Google
          </Button>
        </div>
        <div className="rounded-lg border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <iframe
            src={extractEmbedUrl(viewingDoc.url)}
            className="w-full h-full border-0"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Google Docs</h1>
          <p className="text-muted-foreground mt-1">Embed and manage Google documents</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Document
        </Button>
      </motion.div>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            💡 Documents must be shared as <strong>"Anyone with the link"</strong> (view or edit) for the embed to work.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-8" />
            </Card>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Add a Google Docs, Sheets, or Slides link to embed it here.
            </p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => {
            const config = docTypeConfig[doc.doc_type] || docTypeConfig.document;
            const Icon = config.icon;
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setViewingDoc(doc)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <CardTitle className="text-sm font-medium truncate">{doc.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className={config.color}>{config.label}</Badge>
                  <p className="text-xs text-muted-foreground mt-2 truncate">{doc.url}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Google Document</DialogTitle>
            <DialogDescription>Paste a Google Docs, Sheets, or Slides URL to embed it in the dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input placeholder="e.g. Class Schedule" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Google URL</Label>
              <Input
                placeholder="https://docs.google.com/document/d/..."
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  const detected = detectDocType(e.target.value);
                  if (detected !== 'document') setDocType(detected);
                }}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Document'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
