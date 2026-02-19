/**
 * scheduled-book-indexing — Standardized with shared utilities
 *
 * Scans for books needing indexing and processes them in a scheduled job.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

interface PageData {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string | null;
}

interface OCRResult {
  topics: string[];
  keywords: string[];
  chapter_title: string | null;
  summary: string;
}

// Logic duplicated from ocr-index-book, but for batch processing
async function analyzePageWithAI(imageUrl: string, apiKey: string): Promise<OCRResult> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content analyzer. Focus ONLY on identifying topics, lessons, and chapters from textbook pages. Do NOT extract full text. Always respond with valid JSON only, no markdown.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this textbook/book page. Extract ONLY:
1. Topic/Lesson name visible
2. Chapter or Section title if visible
3. Key concepts and keywords (5-10 terms)
4. A brief 1-sentence summary

Return ONLY valid JSON in this exact format:
{
  "topics": ["Topic 1"],
  "chapter_title": "Chapter title or null",
  "keywords": ["keyword1"],
  "summary": "Brief summary"
}`
            },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI Gateway error:', response.status, error);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const parsed = JSON.parse(jsonStr.trim());
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      chapter_title: parsed.chapter_title || null,
      summary: parsed.summary || '',
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e, content);
    return { topics: [], keywords: [], chapter_title: null, summary: 'Unable to parse page content' };
  }
}

async function indexSingleBook(supabase: any, bookId: string, bookTitle: string, apiKey: string) {
  console.log(`[Scheduled Indexing] Starting: ${bookTitle} (${bookId})`);

  await supabase.from('books').update({ index_status: 'indexing' }).eq('id', bookId);

  const { data: pages, error: pagesError } = await supabase
    .from('book_pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number');

  if (pagesError || !pages) {
    console.error(`Failed to fetch pages for ${bookTitle}:`, pagesError?.message);
    await supabase.from('books').update({ index_status: 'error' }).eq('id', bookId);
    return { success: false, error: pagesError?.message };
  }

  console.log(`[Scheduled Indexing] ${bookTitle}: ${pages.length} pages to process`);

  let successCount = 0;
  let errorCount = 0;

  for (const page of pages as PageData[]) {
    try {
      const { data: existing } = await supabase
        .from('book_page_index')
        .select('id')
        .eq('page_id', page.id)
        .eq('index_status', 'completed')
        .maybeSingle();

      if (existing) {
        successCount++;
        continue;
      }

      await supabase
        .from('book_page_index')
        .upsert({
          book_id: bookId,
          page_id: page.id,
          page_number: page.page_number,
          index_status: 'processing',
        }, { onConflict: 'book_id,page_id' });

      const imageUrl = page.thumbnail_url || page.image_url;
      const result = await analyzePageWithAI(imageUrl, apiKey);

      await supabase
        .from('book_page_index')
        .upsert({
          book_id: bookId,
          page_id: page.id,
          page_number: page.page_number,
          extracted_text: '',
          topics: result.topics,
          keywords: result.keywords,
          chapter_title: result.chapter_title,
          summary: result.summary,
          index_status: 'completed',
          indexed_at: new Date().toISOString(),
        }, { onConflict: 'book_id,page_id' });

      successCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error processing page ${page.page_number}:`, error);
      errorCount++;

      await supabase
        .from('book_page_index')
        .upsert({
          book_id: bookId,
          page_id: page.id,
          page_number: page.page_number,
          index_status: 'error',
        }, { onConflict: 'book_id,page_id' });

      if (error instanceof Error && error.message.includes('429')) {
        console.log('Rate limited, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  const finalStatus = errorCount === pages.length ? 'error' : 'indexed';
  await supabase.from('books').update({ index_status: finalStatus }).eq('id', bookId);

  console.log(`[Scheduled Indexing] ${bookTitle} complete. Success: ${successCount}, Errors: ${errorCount}`);
  return { success: true, successCount, errorCount };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createServiceClient();

    console.log('[Scheduled Indexing] Starting midnight UAE indexing job...');

    const { data: pendingBooks, error: booksError } = await supabase
      .from('books')
      .select('id, title')
      .eq('status', 'ready')
      .or('index_status.is.null,index_status.eq.pending')
      .order('created_at', { ascending: true });

    if (booksError) {
      throw new Error(`Failed to fetch pending books: ${booksError.message}`);
    }

    if (!pendingBooks || pendingBooks.length === 0) {
      console.log('[Scheduled Indexing] No pending books to index.');
      return jsonResponse({ message: 'No pending books to index', processed: 0 });
    }

    console.log(`[Scheduled Indexing] Found ${pendingBooks.length} book(s) to index`);

    const results = [];
    for (const book of pendingBooks) {
      const result = await indexSingleBook(supabase, book.id, book.title, LOVABLE_API_KEY);
      results.push({ book: book.title, ...result });

      if (pendingBooks.indexOf(book) < pendingBooks.length - 1) {
        console.log('[Scheduled Indexing] Waiting 5 seconds before next book...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('[Scheduled Indexing] Job completed.', results);

    return jsonResponse({
      message: 'Scheduled indexing completed',
      processed: pendingBooks.length,
      results
    });

  } catch (error) {
    const err = error as Error;
    console.error('[Scheduled Indexing] Error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
