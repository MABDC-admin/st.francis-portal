import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.88.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchMatch {
  page_number: number;
  page_id: string;
  snippet: string;
  topics: string[];
  keywords: string[];
  chapter_title: string | null;
  relevance_score: number;
}

interface BookResult {
  book_id: string;
  book_title: string;
  cover_url: string | null;
  grade_level: string;
  subject: string | null;
  matches: SearchMatch[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, grade_level, subject, limit = 50 } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Search query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchTerms = query.trim().split(/\s+/).join(' & ');
    const searchQuery = query.trim().toLowerCase();

    console.log(`Searching for: "${query}" (terms: ${searchTerms})`);

    // Perform full-text search using PostgreSQL
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_book_pages', {
        search_query: searchTerms,
        result_limit: limit
      });

    // If RPC doesn't exist, fall back to direct query
    let results = searchResults;
    if (searchError) {
      console.log("RPC not available, using direct query:", searchError.message);

      // Direct query with ILIKE for fallback
      const { data, error } = await supabase
        .from('book_page_index')
        .select(`
          id,
          book_id,
          page_id,
          page_number,
          extracted_text,
          topics,
          keywords,
          chapter_title,
          summary,
          books!inner(id, title, cover_url, grade_level, subject, is_active)
        `)
        .eq('index_status', 'completed')
        .eq('books.is_active', true)
        .or(`extracted_text.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,chapter_title.ilike.%${searchQuery}%`)
        .limit(limit);

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      results = data;
    }

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ results: [], total_matches: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group results by book
    const bookMap = new Map<string, BookResult>();

    for (const row of results) {
      const book = row.books || row;
      const bookId = row.book_id;

      // Apply filters
      if (grade_level && book.grade_level !== grade_level) continue;
      if (subject && book.subject !== subject) continue;

      // Create snippet with highlighted text
      let snippet = row.extracted_text || row.summary || "";
      const snippetLength = 200;

      // Find the position of the search term and create context
      const lowerSnippet = snippet.toLowerCase();
      const termPos = lowerSnippet.indexOf(searchQuery);

      if (termPos !== -1) {
        const start = Math.max(0, termPos - 50);
        const end = Math.min(snippet.length, termPos + searchQuery.length + 100);
        snippet = (start > 0 ? "..." : "") +
          snippet.substring(start, end) +
          (end < snippet.length ? "..." : "");
      } else if (snippet.length > snippetLength) {
        snippet = snippet.substring(0, snippetLength) + "...";
      }

      // Highlight matching terms in snippet
      const highlightedSnippet = snippet.replace(
        new RegExp(`(${searchQuery.split(/\s+/).join('|')})`, 'gi'),
        '**$1**'
      );

      // Calculate relevance score
      let score = 0;
      const text = (row.extracted_text || "").toLowerCase();
      const titleMatch = (row.chapter_title || "").toLowerCase().includes(searchQuery);
      const topicMatch = (row.topics || []).some((t: string) => t.toLowerCase().includes(searchQuery));
      const keywordMatch = (row.keywords || []).some((k: string) => k.toLowerCase().includes(searchQuery));

      if (titleMatch) score += 3;
      if (topicMatch) score += 2;
      if (keywordMatch) score += 1.5;

      // Count occurrences
      const regex = new RegExp(searchQuery, 'gi');
      const matches = text.match(regex);
      score += (matches?.length || 0) * 0.1;

      const match: SearchMatch = {
        page_number: row.page_number,
        page_id: row.page_id,
        snippet: highlightedSnippet,
        topics: row.topics || [],
        keywords: row.keywords || [],
        chapter_title: row.chapter_title,
        relevance_score: Math.min(score, 10), // Cap at 10
      };

      if (!bookMap.has(bookId)) {
        bookMap.set(bookId, {
          book_id: bookId,
          book_title: book.title || "Unknown Book",
          cover_url: book.cover_url,
          grade_level: book.grade_level,
          subject: book.subject,
          matches: [],
        });
      }

      bookMap.get(bookId)!.matches.push(match);
    }

    // Sort matches within each book by relevance
    const bookResults: BookResult[] = [];
    for (const book of bookMap.values()) {
      book.matches.sort((a, b) => b.relevance_score - a.relevance_score);
      bookResults.push(book);
    }

    // Sort books by their best match relevance
    bookResults.sort((a, b) => {
      const aMax = Math.max(...a.matches.map(m => m.relevance_score));
      const bMax = Math.max(...b.matches.map(m => m.relevance_score));
      return bMax - aMax;
    });

    const totalMatches = bookResults.reduce((sum, b) => sum + b.matches.length, 0);

    console.log(`Found ${totalMatches} matches in ${bookResults.length} books`);

    return new Response(
      JSON.stringify({
        results: bookResults,
        total_matches: totalMatches,
        books_count: bookResults.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
