import { useEffect, useRef, useCallback, useState, lazy, Suspense } from 'react';
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then((mod) => ({ default: mod.Excalidraw }))
);

interface ExcalidrawEditorProps {
  drawingId: string;
  title: string;
  onBack: () => void;
}

export const ExcalidrawEditor = ({ drawingId, title, onBack }: ExcalidrawEditorProps) => {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('excalidraw_drawings')
        .select('scene_data')
        .eq('id', drawingId)
        .single();

      if (!error && data?.scene_data) {
        const scene = data.scene_data as any;
        setInitialData({
          elements: scene.elements || [],
          appState: scene.appState || {},
          files: scene.files || undefined,
        });
      } else {
        setInitialData({ elements: [], appState: {} });
      }
      setLoading(false);
    };
    load();
  }, [drawingId]);

  const saveScene = useCallback(async () => {
    if (!apiRef.current) return;
    setSaving(true);
    try {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const files = apiRef.current.getFiles();

      const sceneData = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
      };

      const { error } = await supabase
        .from('excalidraw_drawings')
        .update({ scene_data: sceneData as any })
        .eq('id', drawingId);

      if (error) throw error;
    } catch {
      toast.error('Failed to save drawing');
    } finally {
      setSaving(false);
    }
  }, [drawingId]);

  const handleChange = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(saveScene, 3000);
  }, [saveScene]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-lg font-semibold truncate">{title}</h2>
        </div>
        <Button size="sm" variant="outline" onClick={saveScene} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-border">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
          <Excalidraw
            excalidrawAPI={(api) => { apiRef.current = api; }}
            initialData={initialData || undefined}
            onChange={handleChange}
          />
        </Suspense>
      </div>
    </div>
  );
};
