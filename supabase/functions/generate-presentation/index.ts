const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STYLE_DESCRIPTIONS: Record<string, string> = {
  modern: 'Modern Minimal - Clean lines, lots of white space, bold typography, minimal color palette with one accent color',
  corporate: 'Corporate Professional - Traditional business style, navy/gray tones, structured layouts, formal typography',
  creative: 'Creative Colorful - Vibrant colors, playful design elements, dynamic layouts, artistic flourishes',
  academic: 'Academic - Scholarly appearance, serif fonts, subdued colors, focus on content clarity',
  dark: 'Dark Mode - Dark backgrounds with light text, neon accents, modern tech aesthetic',
};

interface PresentationRequest {
  topic: string;
  slideCount: number;
  style: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, slideCount, style } = await req.json() as PresentationRequest;

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const styleDescription = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.modern;
    const actualSlideCount = Math.min(Math.max(slideCount || 8, 4), 12);

    const systemPrompt = `You are an expert presentation designer and content creator. Your task is to create professional, visually-appealing presentation content that follows best practices from top design agencies and presentation experts.

When creating presentations:
1. Use clear, concise bullet points (max 5-6 per slide)
2. Include compelling headlines that capture attention
3. Suggest relevant visuals, icons, or data visualizations
4. Structure content for maximum impact and flow
5. Include speaker notes with additional context
6. Recommend design elements that enhance the message

Style: ${styleDescription}

Format your response as markdown with clear slide separators. Each slide should follow this structure:

## Slide N: [Slide Title]

### Content
- Bullet point 1
- Bullet point 2
- Bullet point 3

### Design Notes
- Layout suggestion
- Suggested visual/icon
- Color accent recommendation

### Speaker Notes
Brief notes for the presenter...

---`;

    const userPrompt = `Create a professional ${actualSlideCount}-slide presentation about: "${topic}"

Include:
1. Title slide with impactful subtitle
2. Agenda/Overview slide
3. ${actualSlideCount - 4} content slides with key information, statistics, and insights
4. Summary/Key Takeaways slide
5. Call to Action or Next Steps slide

Make it engaging, informative, and visually appealing. Research suggests that the best presentations use storytelling, data visualization, and clear visual hierarchy. Apply these principles.`;

    console.log(`Generating ${actualSlideCount}-slide presentation about: ${topic}`);

    // Call the AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

              const data = trimmedLine.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error generating presentation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
