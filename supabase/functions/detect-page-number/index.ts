/**
 * detect-page-number — Standardized with shared utilities
 *
 * Uses Lovable AI (Gemini) to detect page numbers in book scan images.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

interface PageDetectionRequest {
  imageUrl: string;
  pageIndex: number;
  bookId?: string;
  pageId?: string;
}

interface PageDetectionResult {
  pageIndex: number;
  detectedPageNumber: string | null;
  pageType: 'numbered' | 'cover' | 'blank' | 'unknown';
  confidence: number;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { imageUrl, pageIndex, bookId, pageId } = await req.json() as PageDetectionRequest;

    if (!imageUrl) {
      return errorResponse('Image URL is required', 400, 'MISSING_IMAGE');
    }

    const supabase = createServiceClient();

    // Check cache
    if (pageId) {
      const { data: existing } = await supabase
        .from('book_pages')
        .select('detected_page_number, page_type, detection_confidence, detection_completed')
        .eq('id', pageId)
        .single();

      if (existing?.detection_completed) {
        console.log(`Page ${pageIndex} already detected, returning cached result`);
        return jsonResponse({
          pageIndex,
          detectedPageNumber: existing.detected_page_number,
          pageType: existing.page_type || 'unknown',
          confidence: existing.detection_confidence || 0,
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return errorResponse('AI service not configured', 500, 'CONFIG_ERROR');
    }

    console.log(`Analyzing page at index ${pageIndex}: ${imageUrl.substring(0, 100)}...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a page number detection assistant. Analyze book page images to detect the printed page number. 
            
Your task:
1. Look for printed page numbers (usually at corners, header, or footer of the page)
2. Identify if this is a cover page (front cover, back cover, title page)
3. Identify if this is a blank page
4. For numbered pages, extract the exact page number shown

Respond with a JSON object only, no markdown:
{
  "detectedPageNumber": "1" or null if not found,
  "pageType": "numbered" | "cover" | "blank" | "unknown",
  "confidence": 0.0 to 1.0
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this book page image and detect the page number if present. Return the result as JSON.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return errorResponse('Rate limit exceeded', 429);
      if (response.status === 402) return errorResponse('AI credits exhausted', 402);
      return errorResponse('AI analysis failed', 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`AI response for page ${pageIndex}:`, content);

    let result: PageDetectionResult = {
      pageIndex,
      detectedPageNumber: null,
      pageType: 'unknown',
      confidence: 0
    };

    try {
      let jsonStr = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr);
      result = {
        pageIndex,
        detectedPageNumber: parsed.detectedPageNumber || null,
        pageType: parsed.pageType || 'unknown',
        confidence: parsed.confidence || 0
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Persist result
    if (pageId) {
      const { error: updateError } = await supabase
        .from('book_pages')
        .update({
          detected_page_number: result.detectedPageNumber,
          page_type: result.pageType,
          detection_confidence: result.confidence,
          detection_completed: true,
        })
        .eq('id', pageId);

      if (updateError) {
        console.error('Failed to persist detection result:', updateError);
      } else {
        console.log(`Persisted detection for page ${pageIndex} (${pageId})`);
      }
    }

    return jsonResponse(result);
  } catch (error) {
    console.error('Error in detect-page-number:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
