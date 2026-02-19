/**
 * generate-ai-image — Standardized with shared utilities
 *
 * Uses Lovable AI (Gemini) to generate images.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../_shared/response.ts';

Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return errorResponse('Prompt is required', 400, 'MISSING_PROMPT');
    }

    console.log(`User ${auth.user.id} requesting image generation: "${prompt.slice(0, 80)}..."`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return errorResponse('AI service not configured', 500, 'CONFIG_ERROR');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);

      if (response.status === 429) return errorResponse('Rate limit exceeded', 429);
      if (response.status === 402) return errorResponse('AI credits exhausted', 402);
      return errorResponse(`AI service error: ${response.status}`, 500);
    }

    const data = await response.json();
    console.log('Image generation response received');

    const message = data.choices?.[0]?.message;
    const textContent = message?.content || '';
    const images = message?.images || [];

    return jsonResponse({ text: textContent, images });
  } catch (error) {
    const err = error as Error;
    console.error('Error in generate-ai-image:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
