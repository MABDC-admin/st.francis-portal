/**
 * analyze-book-cover — Standardized with shared utilities
 *
 * Uses Lovable AI (Gemini) to analyze book covers for title, subject, and grade level.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/response.ts';

interface AnalyzeRequest {
  imageBase64: string;
  filename?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { imageBase64 }: AnalyzeRequest = await req.json();

    if (!imageBase64) {
      return errorResponse('No image provided', 400, 'MISSING_IMAGE');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return errorResponse('AI service not configured', 500, 'CONFIG_ERROR');
    }

    console.log('Analyzing book cover image...');

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this book cover image and extract:
1. The exact book title (as written on the cover)
2. The subject (Mathematics, Science, English, Filipino, Social Studies, MAPEH, TLE, Values Education, or Other)
3. The grade level if visible (1-12)

Respond in JSON format only with these fields:
{
  "title": "extracted title or null if not visible",
  "subject": "detected subject or null",
  "gradeLevel": number or null
}

Be precise with the title - extract exactly what's written on the cover.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);

      if (response.status === 429) return errorResponse('Rate limit exceeded', 429, 'RATE_LIMIT');
      if (response.status === 402) return errorResponse('AI credits exhausted', 402, 'CREDITS_EXHAUSTED');

      return errorResponse('AI analysis failed', 500, 'AI_ERROR');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return errorResponse('No response from AI', 500, 'NO_CONTENT');
    }

    console.log('AI response content:', content);

    let parsed: { title?: string; subject?: string; gradeLevel?: number };
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) ||
        [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return errorResponse('Failed to parse AI response', 500, 'PARSE_ERROR');
    }

    return jsonResponse({
      success: true,
      title: parsed.title || undefined,
      subject: parsed.subject || undefined,
      gradeLevel: parsed.gradeLevel || undefined,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error analyzing book cover:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
