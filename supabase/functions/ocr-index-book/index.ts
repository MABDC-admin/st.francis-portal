/**
 * ocr-index-book — Standardized with shared utilities
 *
 * Analyzes book pages with Lovable AI (Gemini) to extract educational metadata.
 * Runs as a background task.
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
  extracted_text: string;
  topics: string[];
  keywords: string[];
  chapter_title: string | null;
  summary: string;
}

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
      extracted_text: '',
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      chapter_title: parsed.chapter_title || null,
      summary: parsed.summary || '',
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e, content);
    return {
      extracted_text: '',
      topics: [],
      keywords: [],
      chapter_title: null,
      summary: 'Unable to parse page content',
    };
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { book_id, start_page, end_page } = await req.json();

    if (!book_id) {
      return errorResponse('book_id is required', 400);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return errorResponse('LOVABLE_API_KEY is not configured', 500);
    }

    const supabase = createServiceClient();

    console.log(`Starting OCR indexing for book: ${book_id}`);

    await supabase.from('books').update({ index_status: 'indexing' }).eq('id', book_id);

    let query = supabase.from('book_pages').select('*').eq('book_id', book_id).order('page_number');
    if (start_page) query = query.gte('page_number', start_page);
    if (end_page) query = query.lte('page_number', end_page);

    const { data: pages, error: pagesError } = await query;

    if (pagesError || !pages) {
      return errorResponse(`Failed to fetch pages: ${pagesError?.message}`, 500);
    }

    console.log(`Found ${pages.length} pages to process`);

    const backgroundTask = async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const page of pages as PageData[]) {
        try {
          console.log(`Processing page ${page.page_number}...`);

          const { data: existing } = await supabase
            .from('book_page_index')
            .select('id')
            .eq('page_id', page.id)
            .eq('index_status', 'completed')
            .maybeSingle();

          if (existing) {
            console.log(`Page ${page.page_number} already indexed, skipping`);
            successCount++;
            continue;
          }

          await supabase
            .from('book_page_index')
            .upsert({
              book_id,
              page_id: page.id,
              page_number: page.page_number,
              index_status: 'processing',
            }, { onConflict: 'book_id,page_id' });

          const imageUrl = page.thumbnail_url || page.image_url;
          const result = await analyzePageWithAI(imageUrl, LOVABLE_API_KEY);

          await supabase
            .from('book_page_index')
            .upsert({
              book_id,
              page_id: page.id,
              page_number: page.page_number,
              extracted_text: result.extracted_text,
              topics: result.topics,
              keywords: result.keywords,
              chapter_title: result.chapter_title,
              summary: result.summary,
              index_status: 'completed',
              indexed_at: new Date().toISOString(),
            }, { onConflict: 'book_id,page_id' });

          successCount++;
          console.log(`Page ${page.page_number} indexed successfully`);
          await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
          console.error(`Error processing page ${page.page_number}:`, error);
          errorCount++;

          await supabase
            .from('book_page_index')
            .upsert({
              book_id,
              page_id: page.id,
              page_number: page.page_number,
              index_status: 'error',
            }, { onConflict: 'book_id,page_id' });

          if (error instanceof Error && error.message.includes('429')) {
            console.log('Rate limited, waiting 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

      const finalStatus = errorCount === pages.length ? 'error' : 'indexed';
      await supabase.from('books').update({ index_status: finalStatus }).eq('id', book_id);
      console.log(`Indexing complete. Success: ${successCount}, Errors: ${errorCount}`);
    };

    // Start background task
    // @ts-ignore: Deno Edge Runtime
    EdgeRuntime.waitUntil(backgroundTask());

    return jsonResponse({
      message: 'OCR indexing started',
      pages_to_process: pages.length
    });

  } catch (error) {
    const err = error as Error;
    console.error('OCR indexing error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
