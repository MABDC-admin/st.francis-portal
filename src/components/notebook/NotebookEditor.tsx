import { useState, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { NotebookCell } from './NotebookCell';
import {
  useNotebook,
  useUpdateNotebook,
  useCreateCell,
  useUpdateCell,
  useDeleteCell,
  useReorderCells,
  NotebookCell as NotebookCellType,
} from '@/hooks/useNotebooks';

interface NotebookEditorProps {
  notebookId: string;
}

// Custom debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function NotebookEditor({ notebookId }: NotebookEditorProps) {
  const { data, isLoading } = useNotebook(notebookId);
  const updateNotebook = useUpdateNotebook();
  const createCell = useCreateCell();
  const updateCell = useUpdateCell();
  const deleteCell = useDeleteCell();
  const reorderCells = useReorderCells();

  const [title, setTitle] = useState('');
  const [cells, setCells] = useState<NotebookCellType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [runningCellId, setRunningCellId] = useState<string | null>(null);
  const [streamingOutput, setStreamingOutput] = useState<Record<string, string>>({});

  const debouncedTitle = useDebounceValue(title, 500);

  // Initialize state from data
  useEffect(() => {
    if (data) {
      setTitle(data.notebook.title);
      setCells(data.cells);
    }
  }, [data]);

  // Auto-save title
  useEffect(() => {
    if (debouncedTitle && data?.notebook && debouncedTitle !== data.notebook.title) {
      setIsSaving(true);
      updateNotebook.mutate(
        { id: notebookId, title: debouncedTitle },
        { onSettled: () => setTimeout(() => setIsSaving(false), 500) }
      );
    }
  }, [debouncedTitle, notebookId, data?.notebook]);

  const handleAddCell = async (type: 'markdown' | 'llm') => {
    const position = cells.length;
    const newCell = await createCell.mutateAsync({
      notebook_id: notebookId,
      cell_type: type,
      position,
    });
    setCells([...cells, newCell]);
  };

  const handleCellContentChange = useCallback((cellId: string, content: string) => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, content } : c))
    );
    // Debounced save is handled in the cell component
  }, []);

  const handleCellSave = useCallback(async (cellId: string, content: string) => {
    await updateCell.mutateAsync({ id: cellId, content });
  }, [updateCell]);

  const handleCellTypeChange = useCallback(async (cellId: string, type: 'markdown' | 'llm') => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, cell_type: type } : c))
    );
    await updateCell.mutateAsync({ id: cellId, cell_type: type });
  }, [updateCell]);

  const handleDeleteCell = useCallback(async (cellId: string) => {
    setCells((prev) => prev.filter((c) => c.id !== cellId));
    await deleteCell.mutateAsync({ cellId, notebookId });
  }, [deleteCell, notebookId]);

  const handleReorder = useCallback((newOrder: NotebookCellType[]) => {
    setCells(newOrder);
  }, []);

  const handleReorderEnd = useCallback(() => {
    const cellIds = cells.map((c) => c.id);
    reorderCells.mutate({ notebookId, cellIds });
  }, [cells, notebookId, reorderCells]);

  const handleRunCell = useCallback(async (cellId: string) => {
    const cell = cells.find((c) => c.id === cellId);
    if (!cell || cell.cell_type !== 'llm' || !cell.content.trim()) return;

    setRunningCellId(cellId);
    setStreamingOutput((prev) => ({ ...prev, [cellId]: '' }));

    try {
      const { data: session } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notebook-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: cell.content }],
            model: 'google/gemini-2.5-flash',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullOutput = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.content || '';
            if (content) {
              fullOutput += content;
              setStreamingOutput((prev) => ({ ...prev, [cellId]: fullOutput }));
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Save the final output
      await updateCell.mutateAsync({ id: cellId, output: fullOutput });
      setCells((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, output: fullOutput } : c))
      );
    } catch (error) {
      console.error('Error running cell:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStreamingOutput((prev) => ({ ...prev, [cellId]: `Error: ${errorMessage}` }));
    } finally {
      setRunningCellId(null);
    }
  }, [cells, updateCell]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Notebook not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
          placeholder="Notebook Title"
        />
        {isSaving ? (
          <Save className="h-4 w-4 text-muted-foreground animate-pulse" />
        ) : (
          <Check className="h-4 w-4 text-success" />
        )}
      </div>

      {/* Cells */}
      <Reorder.Group axis="y" values={cells} onReorder={handleReorder}>
        {cells.map((cell) => (
          <Reorder.Item
            key={cell.id}
            value={cell}
            onDragEnd={handleReorderEnd}
          >
            <NotebookCell
              cell={cell}
              isRunning={runningCellId === cell.id}
              streamingOutput={streamingOutput[cell.id]}
              onContentChange={(content) => handleCellContentChange(cell.id, content)}
              onSave={(content) => handleCellSave(cell.id, content)}
              onTypeChange={(type) => handleCellTypeChange(cell.id, type)}
              onDelete={() => handleDeleteCell(cell.id)}
              onRun={() => handleRunCell(cell.id)}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Add Cell Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-muted rounded-lg"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddCell('markdown')}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Markdown
        </Button>
        <span className="text-muted-foreground">|</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddCell('llm')}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          LLM Prompt
        </Button>
      </motion.div>
    </div>
  );
}
