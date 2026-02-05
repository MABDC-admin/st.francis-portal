const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STYLE_DESCRIPTIONS: Record<string, string> = {
  modern: 'Modern Minimal - Clean lines, generous white space, bold sans-serif typography, minimal color palette with striking accents. Use geometric shapes, subtle gradients, and asymmetric layouts.',
  corporate: 'Corporate Professional - Sophisticated navy/slate tones, structured grid layouts, data visualizations, professional icons. Clean hierarchy with elegant typography.',
  creative: 'Creative Colorful - Vibrant gradients, bold color combinations, playful illustrations, dynamic asymmetric layouts. Mix typography styles with artistic flourishes.',
  academic: 'Academic Scholarly - Clean structured layouts, serif fonts for authority, diagrams and flowcharts, subdued earth tones with scholarly accents.',
  dark: 'Dark Mode Tech - Dark backgrounds (#0F172A), neon accent colors, glassmorphism effects, tech-inspired patterns, monospace fonts for code elements.',
};

const VISUAL_SUGGESTIONS: Record<string, string[]> = {
  modern: [
    'Large hero images with text overlay',
    'Circular profile photos with drop shadows',
    'Subtle gradient backgrounds',
    'Thin line icons in accent colors',
    'Full-bleed photography',
  ],
  corporate: [
    'Bar charts and line graphs',
    'Icon grids for features/benefits',
    'Timeline infographics',
    'Professional stock photography',
    'Branded color blocks',
  ],
  creative: [
    'Hand-drawn illustrations',
    'Colorful blob shapes',
    'Overlapping transparent shapes',
    'Bold typography as focal point',
    'Playful icon animations',
  ],
  academic: [
    'Flowcharts and diagrams',
    'Comparison tables',
    'Citation callout boxes',
    'Process step graphics',
    'Research data visualizations',
  ],
  dark: [
    'Glowing neon accent lines',
    'Code snippet blocks',
    'Glassmorphic cards',
    'Particle effects background',
    'Gradient mesh backgrounds',
  ],
};

interface PresentationRequest {
  topic: string;
  slideCount: number;
  style: string;
  designInspiration?: {
    inspiration?: Array<{ title: string; content: string }>;
    topicFacts?: Array<{ title: string; content: string }>;
    designTips?: string[];
  };
}

async function fetchDesignInspiration(topic: string, style: string): Promise<any> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.log('Firecrawl not configured, skipping design research');
    return null;
  }

  try {
    const styleKeywords: Record<string, string> = {
      modern: 'modern minimal clean',
      corporate: 'professional corporate business',
      creative: 'creative colorful vibrant',
      academic: 'academic educational scholarly',
      dark: 'dark mode tech futuristic',
    };

    const searchQuery = `${topic} presentation design ${styleKeywords[style] || 'modern'} site:dribbble.com OR site:behance.net OR site:pinterest.com`;
    
    console.log('Fetching design inspiration for:', topic);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    });

    if (!response.ok) {
      console.log('Firecrawl search failed, continuing without inspiration');
      return null;
    }

    const data = await response.json();
    const inspiration = (data.data || []).map((result: any) => ({
      title: result.title || 'Design Inspiration',
      url: result.url,
      content: result.markdown?.slice(0, 400) || result.description || '',
    }));

    // Also fetch topic facts for richer content
    let topicFacts: any[] = [];
    try {
      const factsResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${topic} statistics facts data 2024 2025`,
          limit: 3,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      if (factsResponse.ok) {
        const factsData = await factsResponse.json();
        topicFacts = (factsData.data || []).map((result: any) => ({
          title: result.title || '',
          content: result.markdown?.slice(0, 600) || '',
        }));
      }
    } catch {
      console.log('Topic facts fetch failed, continuing');
    }

    console.log(`Found ${inspiration.length} design inspirations and ${topicFacts.length} topic facts`);

    return {
      inspiration,
      topicFacts,
    };
  } catch (error) {
    console.error('Design inspiration fetch error:', error);
    return null;
  }
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
    const visualSuggestions = VISUAL_SUGGESTIONS[style] || VISUAL_SUGGESTIONS.modern;
    const actualSlideCount = Math.min(Math.max(slideCount || 8, 4), 12);

    // Fetch design inspiration from Firecrawl
    const inspiration = await fetchDesignInspiration(topic, style);

    // Build enhanced prompt with inspiration context
    let inspirationContext = '';
    if (inspiration?.inspiration?.length > 0) {
      inspirationContext = `\n\n## Design Inspiration from the Web:\n`;
      inspiration.inspiration.forEach((item: any, idx: number) => {
        inspirationContext += `${idx + 1}. "${item.title}"\n`;
      });
    }

    let factsContext = '';
    if (inspiration?.topicFacts?.length > 0) {
      factsContext = `\n\n## Research & Facts about the Topic:\n`;
      inspiration.topicFacts.forEach((item: any) => {
        if (item.content) {
          factsContext += `- ${item.content.slice(0, 300)}...\n`;
        }
      });
    }

    const systemPrompt = `You are an award-winning presentation designer from a top design agency like IDEO or Pentagram. Create stunning, visually-driven presentations that captivate audiences.

## Design Philosophy:
- Every slide should have a clear visual hierarchy
- Use the "one idea per slide" principle
- Content should breathe - generous spacing
- Headlines should be punchy and memorable
- Visuals should reinforce, not repeat, the text

## Style: ${styleDescription}

## Visual Elements to Include:
${visualSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${inspirationContext}
${factsContext}

## Output Format:
For each slide, provide:

## Slide N: [Compelling Title]

### Content
- Concise bullet point (max 8 words)
- Another key point
- Third impactful point
(Maximum 5 bullets per slide)

### Design Notes
- **Layout**: Describe the visual layout (e.g., "Split layout: left text, right full-bleed image")
- **Visual**: Specific visual element (e.g., "Circular infographic showing 3 steps")
- **Color**: Color accent recommendation (e.g., "Use cyan (#06B6D4) accent for data points")
- **Animation**: Suggested entrance animation (e.g., "Fade in from left, staggered bullets")

### Speaker Notes
Brief presenter guidance (2-3 sentences)...

---`;

    const userPrompt = `Create a professional ${actualSlideCount}-slide presentation about: "${topic}"

Structure:
1. **Title Slide** - Impactful title + memorable subtitle
2. **Overview Slide** - Agenda with visual icons
3-${actualSlideCount - 2}. **Content Slides** - Key insights with compelling visuals, statistics, and storytelling
${actualSlideCount - 1}. **Summary Slide** - Key takeaways with visual recap
${actualSlideCount}. **Call to Action** - Clear next steps with contact/resources

Requirements:
- Include specific statistics and data points where relevant
- Suggest specific icon types (e.g., "rocket icon", "chart icon")
- Recommend specific visual layouts for each slide
- Make headlines memorable and action-oriented
- Use storytelling techniques to create flow`;

    console.log(`Generating ${actualSlideCount}-slide presentation about: ${topic} with ${inspiration?.inspiration?.length || 0} design inspirations`);

    // Call the AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        max_tokens: 12000,
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
