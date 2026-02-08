import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Tldraw, createTLStore, getSnapshot, loadSnapshot, DefaultSpinner } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


interface TldrawEditorProps {
  drawingId: string;
  title: string;
  onBack: () => void;
}

function throttleFn<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    } else {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, ms - (now - last));
    }
  }) as T;
}

export const TldrawEditor = ({ drawingId, title, onBack }: TldrawEditorProps) => {
  const store = useMemo(() => createTLStore(), []);
  const [loadingState, setLoadingState] = useState<
    { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: string }
  >({ status: 'loading' });

  // Load initial data
  useLayoutEffect(() => {
    setLoadingState({ status: 'loading' });

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('excalidraw_drawings')
          .select('scene_data')
          .eq('id', drawingId)
          .single();

        if (!error && data?.scene_data && typeof data.scene_data === 'object') {
          const scene = data.scene_data as any;
          if (scene.document) {
            loadSnapshot(store, scene);
          }
        }
        setLoadingState({ status: 'ready' });
      } catch (e: any) {
        setLoadingState({ status: 'error', error: e.message });
      }
    };

    load();
  }, [drawingId, store]);

  // Auto-save on changes
  useLayoutEffect(() => {
    if (loadingState.status !== 'ready') return;

    const persistFn = throttleFn(async () => {
      const snapshot = getSnapshot(store);
      const { error } = await supabase
        .from('excalidraw_drawings')
        .update({ scene_data: snapshot as any })
        .eq('id', drawingId);
      if (error) console.error('Auto-save failed:', error);
    }, 3000);

    const cleanup = store.listen(persistFn, { source: 'user', scope: 'document' });
    return cleanup;
  }, [store, drawingId, loadingState.status]);

  if (loadingState.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <DefaultSpinner />
      </div>
    );
  }

  if (loadingState.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-destructive">Failed to load: {loadingState.error}</p>
        <Button variant="outline" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-lg font-semibold truncate">{title}</h2>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-border">
        <Tldraw store={store} />
      </div>
    </div>
  );
};
