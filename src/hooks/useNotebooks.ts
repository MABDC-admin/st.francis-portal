import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  school: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotebookCell {
  id: string;
  notebook_id: string;
  cell_type: 'markdown' | 'llm';
  content: string;
  output: string | null;
  position: number;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotebookData {
  title: string;
  description?: string;
  school?: string;
}

export interface UpdateNotebookData {
  id: string;
  title?: string;
  description?: string;
}

export interface CreateCellData {
  notebook_id: string;
  cell_type: 'markdown' | 'llm';
  content?: string;
  position: number;
}

export interface UpdateCellData {
  id: string;
  content?: string;
  output?: string;
  cell_type?: 'markdown' | 'llm';
  model?: string;
}

// Fetch all notebooks for the current user
export function useNotebooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notebooks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Notebook[];
    },
    enabled: !!user,
  });
}

// Fetch a single notebook with its cells
export function useNotebook(notebookId: string | null) {
  return useQuery({
    queryKey: ['notebook', notebookId],
    queryFn: async () => {
      if (!notebookId) return null;

      const { data: notebook, error: notebookError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', notebookId)
        .single();

      if (notebookError) throw notebookError;

      const { data: cells, error: cellsError } = await supabase
        .from('notebook_cells')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('position', { ascending: true });

      if (cellsError) throw cellsError;

      return {
        notebook: notebook as Notebook,
        cells: cells as NotebookCell[],
      };
    },
    enabled: !!notebookId,
  });
}

// Create a new notebook
export function useCreateNotebook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateNotebookData) => {
      const { data: notebook, error } = await supabase
        .from('notebooks')
        .insert({
          user_id: user?.id,
          title: data.title,
          description: data.description || null,
          school: data.school || null,
        })
        .select()
        .single();

      if (error) throw error;
      return notebook as Notebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Notebook created');
    },
    onError: (error) => {
      toast.error('Failed to create notebook: ' + error.message);
    },
  });
}

// Update a notebook
export function useUpdateNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNotebookData) => {
      const { id, ...updates } = data;
      const { data: notebook, error } = await supabase
        .from('notebooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return notebook as Notebook;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.id] });
    },
    onError: (error) => {
      toast.error('Failed to update notebook: ' + error.message);
    },
  });
}

// Delete a notebook
export function useDeleteNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notebookId: string) => {
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', notebookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Notebook deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete notebook: ' + error.message);
    },
  });
}

// Create a new cell
export function useCreateCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCellData) => {
      const { data: cell, error } = await supabase
        .from('notebook_cells')
        .insert({
          notebook_id: data.notebook_id,
          cell_type: data.cell_type,
          content: data.content || '',
          position: data.position,
        })
        .select()
        .single();

      if (error) throw error;
      return cell as NotebookCell;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.notebook_id] });
    },
    onError: (error) => {
      toast.error('Failed to create cell: ' + error.message);
    },
  });
}

// Update a cell
export function useUpdateCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCellData) => {
      const { id, ...updates } = data;
      const { data: cell, error } = await supabase
        .from('notebook_cells')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return cell as NotebookCell;
    },
    onSuccess: (cell) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', cell.notebook_id] });
    },
  });
}

// Delete a cell
export function useDeleteCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cellId, notebookId }: { cellId: string; notebookId: string }) => {
      const { error } = await supabase
        .from('notebook_cells')
        .delete()
        .eq('id', cellId);

      if (error) throw error;
      return notebookId;
    },
    onSuccess: (notebookId) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
    },
    onError: (error) => {
      toast.error('Failed to delete cell: ' + error.message);
    },
  });
}

// Reorder cells
export function useReorderCells() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notebookId, cellIds }: { notebookId: string; cellIds: string[] }) => {
      // Update each cell's position
      const updates = cellIds.map((id, index) =>
        supabase
          .from('notebook_cells')
          .update({ position: index })
          .eq('id', id)
      );

      await Promise.all(updates);
      return notebookId;
    },
    onSuccess: (notebookId) => {
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
    },
  });
}
