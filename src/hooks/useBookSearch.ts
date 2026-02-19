import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SearchMatch {
  page_number: number;
  page_id: string;
  snippet: string;
  topics: string[];
  keywords: string[];
  chapter_title: string | null;
  relevance_score: number;
}

export interface BookSearchResult {
  book_id: string;
  book_title: string;
  cover_url: string | null;
  grade_level: string;
  subject: string | null;
  matches: SearchMatch[];
}

export interface SearchResponse {
  results: BookSearchResult[];
  total_matches: number;
  books_count: number;
}

export const useBookSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const search = useCallback(async (
    query: string,
    options?: {
      grade_level?: string;
      subject?: string;
      limit?: number;
    }
  ): Promise<SearchResponse | null> => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setTotalMatches(0);
      return null;
    }

    setIsSearching(true);
    setSearchQuery(query);

    try {
      const { data, error } = await supabase.functions.invoke('search-books', {
        body: {
          query: query.trim(),
          grade_level: options?.grade_level,
          subject: options?.subject,
          limit: options?.limit || 50,
        },
      });

      if (error) {
        console.error('Search error:', error);
        toast.error('Search failed. Please try again.');
        return null;
      }

      const response = data as SearchResponse;
      setSearchResults(response.results);
      setTotalMatches(response.total_matches);

      return response;
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setTotalMatches(0);
    setSearchQuery('');
  }, []);

  return {
    search,
    clearSearch,
    isSearching,
    searchResults,
    totalMatches,
    searchQuery,
  };
};
