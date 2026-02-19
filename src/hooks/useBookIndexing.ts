import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface BookIndexStatus {
  book_id: string;
  index_status: 'pending' | 'indexing' | 'indexed' | 'error' | null;
  indexed_pages: number;
  total_pages: number;
}

export const useBookIndexing = () => {
  const [isIndexing, setIsIndexing] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch indexing status for all books
  const { data: indexStatuses = [] } = useQuery({
    queryKey: ['book-index-statuses'],
    queryFn: async () => {
      const { data: books, error } = await supabase
        .from('books')
        .select('id, index_status, page_count');

      if (error) throw error;

      // Get indexed page counts
      const { data: indexCounts } = await supabase
        .from('book_page_index')
        .select('book_id')
        .eq('index_status', 'completed');

      const countMap = new Map<string, number>();
      indexCounts?.forEach(row => {
        countMap.set(row.book_id, (countMap.get(row.book_id) || 0) + 1);
      });

      return books.map(book => ({
        book_id: book.id,
        index_status: book.index_status as BookIndexStatus['index_status'],
        indexed_pages: countMap.get(book.id) || 0,
        total_pages: book.page_count || 0,
      }));
    },
    refetchInterval: (query) => {
      // Refetch every 5 seconds if any book is currently indexing
      const hasIndexing = query.state.data?.some(
        (s: BookIndexStatus) => s.index_status === 'indexing'
      );
      return hasIndexing ? 5000 : false;
    },
  });

  const getBookIndexStatus = useCallback((bookId: string): BookIndexStatus | undefined => {
    return indexStatuses.find(s => s.book_id === bookId);
  }, [indexStatuses]);

  const startIndexing = useCallback(async (bookId: string) => {
    setIsIndexing(bookId);

    try {
      const { data, error } = await supabase.functions.invoke('ocr-index-book', {
        body: { book_id: bookId },
      });

      if (error) {
        console.error('Indexing error:', error);
        toast.error('Failed to start indexing');
        return false;
      }

      toast.success(`AI indexing started. Processing ${data.pages_to_process} pages...`);
      
      // Invalidate queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['book-index-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });

      return true;
    } catch (error) {
      console.error('Indexing error:', error);
      toast.error('Failed to start indexing');
      return false;
    } finally {
      setIsIndexing(null);
    }
  }, [queryClient]);

  const reindexBook = useCallback(async (bookId: string) => {
    // Delete existing index entries first
    await supabase
      .from('book_page_index')
      .delete()
      .eq('book_id', bookId);

    // Reset book status
    await supabase
      .from('books')
      .update({ index_status: 'pending' })
      .eq('id', bookId);

    // Start fresh indexing
    return startIndexing(bookId);
  }, [startIndexing]);

  return {
    indexStatuses,
    getBookIndexStatus,
    startIndexing,
    reindexBook,
    isIndexing,
  };
};
