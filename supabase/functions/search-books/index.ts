/**
 * search-books — Standardized with shared utilities
 *
 * Performs full-text search on indexed book pages using PostgreSQL FTS or fallback ILIKE.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../_shared/response.ts';

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

const normalizeGradeLevel = (value: string | null | undefined) => {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw === '0' || raw === 'kinder' || raw === 'kindergarten' || raw.startsWith('kinder ')) {
    return 'kindergarten';
  }

  const digits = raw.match(/\d{1,2}/)?.[0];
  if (digits) {
    return `grade${digits}`;
  }

  return raw.replace(/\s+/g, '');
};

const gradeMatches = (left: string | null | undefined, right: string | null | undefined) => {
  const normalizedLeft = normalizeGradeLevel(left);
  const normalizedRight = normalizeGradeLevel(right);
  return normalizedLeft !== '' && normalizedLeft === normalizedRight;
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { query, grade_level, subject, limit = 50 } = await req.json();

    if (!query || query.trim().length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400);
    }

    const authResult = await requireAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { userClient: supabase } = authResult;
    const searchTerms = query.trim().split(/\s+/).join(' & ');
    const searchQuery = query.trim().toLowerCase();

    console.log(`Searching for: "${query}" (terms: ${searchTerms})`);

    const { data: results, error } = await supabase
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
        books!inner(id, title, cover_url, grade_level, subject, is_active, is_teacher_only, school)
      `)
      .eq('index_status', 'completed')
      .eq('books.is_active', true)
      .or(`extracted_text.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,chapter_title.ilike.%${searchQuery}%`)
      .limit(limit);

    if (error) {
      return errorResponse(`Search failed: ${error.message}`, 500);
    }

    if (!results || results.length === 0) {
      return jsonResponse({ results: [], total_matches: 0 });
    }

    const bookMap = new Map<string, BookResult>();

    for (const row of results as any[]) {
      const book = Array.isArray(row.books) ? row.books[0] : (row.books || row);
      if (!book) continue;
      const bookId = row.book_id;

      if (grade_level && !gradeMatches(book.grade_level, grade_level)) continue;
      if (subject && book.subject !== subject) continue;

      let snippet = row.extracted_text || row.summary || '';
      const snippetLength = 200;
      const lowerSnippet = snippet.toLowerCase();
      const termPos = lowerSnippet.indexOf(searchQuery);

      if (termPos !== -1) {
        const start = Math.max(0, termPos - 50);
        const end = Math.min(snippet.length, termPos + searchQuery.length + 100);
        snippet = (start > 0 ? '...' : '') + snippet.substring(start, end) + (end < snippet.length ? '...' : '');
      } else if (snippet.length > snippetLength) {
        snippet = snippet.substring(0, snippetLength) + '...';
      }

      const highlightedSnippet = snippet.replace(
        new RegExp(`(${searchQuery.split(/\s+/).join('|')})`, 'gi'),
        '**$1**'
      );

      let score = 0;
      const titleMatch = (row.chapter_title || '').toLowerCase().includes(searchQuery);
      const topicMatch = (row.topics || []).some((t: string) => t.toLowerCase().includes(searchQuery));
      const keywordMatch = (row.keywords || []).some((k: string) => k.toLowerCase().includes(searchQuery));

      if (titleMatch) score += 3;
      if (topicMatch) score += 2;
      if (keywordMatch) score += 1.5;

      const regex = new RegExp(searchQuery, 'gi');
      const text = (row.extracted_text || '').toLowerCase();
      const matches = text.match(regex);
      score += (matches?.length || 0) * 0.1;

      const match: SearchMatch = {
        page_number: row.page_number,
        page_id: row.page_id,
        snippet: highlightedSnippet,
        topics: row.topics || [],
        keywords: row.keywords || [],
        chapter_title: row.chapter_title,
        relevance_score: Math.min(score, 10),
      };

      if (!bookMap.has(bookId)) {
        bookMap.set(bookId, {
          book_id: bookId,
          book_title: book.title || 'Unknown Book',
          cover_url: book.cover_url,
          grade_level: book.grade_level,
          subject: book.subject,
          matches: [],
        });
      }

      bookMap.get(bookId)!.matches.push(match);
    }

    const bookResults: BookResult[] = [];
    for (const book of bookMap.values()) {
      book.matches.sort((a, b) => b.relevance_score - a.relevance_score);
      bookResults.push(book);
    }

    bookResults.sort((a, b) => {
      const aMax = Math.max(...a.matches.map(m => m.relevance_score));
      const bMax = Math.max(...b.matches.map(m => m.relevance_score));
      return bMax - aMax;
    });

    const totalMatches = bookResults.reduce((sum, b) => sum + b.matches.length, 0);

    return jsonResponse({
      results: bookResults,
      total_matches: totalMatches,
      books_count: bookResults.length
    });

  } catch (error) {
    const err = error as Error;
    console.error('Search error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
