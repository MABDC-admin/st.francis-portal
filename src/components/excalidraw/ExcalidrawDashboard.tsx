import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ExcalidrawEditor } from './ExcalidrawEditor';

interface Drawing {
  id: string;
  title: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const ExcalidrawDashboard = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeDrawing, setActiveDrawing] = useState<Drawing | null>(null);
  const { data: schoolUuid } = useSchoolId();
  const { user } = useAuth();

  const loadDrawings = async () => {
    if (!schoolUuid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('excalidraw_drawings')
        .select('id, title, is_shared, created_at, updated_at, created_by')
        .eq('school_id', schoolUuid)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDrawings(data || []);
    } catch {
      toast.error('Failed to load drawings');
    } finally {
      setLoading(false);
    }
  };

  const createDrawing = async () => {
    if (!newTitle.trim() || !schoolUuid || !user) return;
    try {
      const { data, error } = await supabase.from('excalidraw_drawings').insert({
        title: newTitle.trim(),
        school_id: schoolUuid,
        created_by: user.id,
        scene_data: {},
      }).select('id, title, is_shared, created_at, updated_at, created_by').single();
      if (error) throw error;
      toast.success('Drawing created');
      setNewTitle('');
      setIsCreateOpen(false);
      if (data) setActiveDrawing(data);
      loadDrawings();
    } catch {
      toast.error('Failed to create drawing');
    }
  };

  const deleteDrawing = async (id: string) => {
    try {
      const { error } = await supabase.from('excalidraw_drawings').delete().eq('id', id);
      if (error) throw error;
      toast.success('Drawing deleted');
      loadDrawings();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleShare = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('excalidraw_drawings').update({ is_shared: !current }).eq('id', id);
      if (error) throw error;
      toast.success(current ? 'Drawing made private' : 'Drawing shared');
      loadDrawings();
    } catch {
      toast.error('Failed to update');
    }
  };

  useEffect(() => { loadDrawings(); }, [schoolUuid]);

  if (activeDrawing) {
    return (
      <ExcalidrawEditor
        drawingId={activeDrawing.id}
        title={activeDrawing.title}
        onBack={() => { setActiveDrawing(null); loadDrawings(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Excalidraw</h1>
          <p className="text-muted-foreground mt-1">Whiteboard & Drawing Tool</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Drawing</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Drawing</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Drawing title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Button onClick={createDrawing} disabled={!newTitle.trim()} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="h-32 animate-pulse bg-muted/30" /></Card>)}
        </div>
      ) : drawings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Pencil className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Drawings Yet</h3>
            <p className="text-muted-foreground">Create your first whiteboard drawing to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drawings.map(drawing => (
            <Card key={drawing.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveDrawing(drawing)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2 truncate">
                    <Pencil className="h-4 w-4 text-primary shrink-0" />
                    {drawing.title}
                  </span>
                  {drawing.is_shared && <Badge variant="secondary" className="shrink-0 text-xs">Shared</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Updated {new Date(drawing.updated_at).toLocaleDateString()}
                </p>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => toggleShare(drawing.id, drawing.is_shared ?? false)}>
                    <Share2 className="h-3 w-3" />
                  </Button>
                  {drawing.created_by === user?.id && (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteDrawing(drawing.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
