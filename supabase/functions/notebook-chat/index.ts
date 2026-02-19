/**
 * notebook-chat — Standardized with shared utilities
 *
 * Handles chat requests with Lovable AI (Gemini), supporting PDF context and streaming responses.
 */
import {
  handleCors,
  errorResponse,
  createServiceClient,
  requireAuth,
} from '../_shared/response.ts';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  systemPrompt?: string;
  model?: string;
  pdfText?: string;
  pdfFilename?: string;
}

Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    console.log(`User ${auth.user.id} making notebook chat request`);

    const body: RequestBody = await req.json();
    const { messages, systemPrompt, model = 'google/gemini-3-flash-preview', pdfText, pdfFilename } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages array is required', 400, 'MISSING_MESSAGES');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return errorResponse('AI service not configured', 500, 'CONFIG_ERROR');
    }

    const formattedMessages: Message[] = [];

    if (pdfText) {
      const pdfSystemPrompt = systemPrompt ||
        `You are a helpful AI assistant analyzing a document. The user has uploaded a PDF file${pdfFilename ? ` named "${pdfFilename}"` : ''}. 
        
Analyze the document content carefully and respond to the user's questions or requests based on this document. 
Provide clear, well-structured responses. Use markdown formatting for better readability.
When summarizing, include key points, main ideas, and important details from the document.`;

      formattedMessages.push({ role: 'system', content: pdfSystemPrompt });

      const lastUserMessage = messages[messages.length - 1];
      const otherMessages = messages.slice(0, -1);

      formattedMessages.push(...otherMessages);

      const userPromptWithPdf = `[DOCUMENT START]
${pdfText}
[DOCUMENT END]

User's request: ${lastUserMessage.content}`;

      formattedMessages.push({ role: 'user', content: userPromptWithPdf });
    } else {
      if (systemPrompt) {
        formattedMessages.push({ role: 'system', content: systemPrompt });
      }
      formattedMessages.push(...messages);
    }

    console.log(`Sending ${formattedMessages.length} messages to ${model}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      if (response.status === 429) return errorResponse('Rate limit exceeded', 429);
      if (response.status === 402) return errorResponse('AI credits exhausted', 402);
      return errorResponse(`AI service error: ${response.status}`, 500);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

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
          console.error('Stream processing error:', error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    const err = error as Error;
    console.error('Error in notebook-chat function:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
