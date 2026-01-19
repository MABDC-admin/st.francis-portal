import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  extracted_text: string;
  detected_type: string;
  summary: string;
  keywords: string[];
  detected_language: string;
  confidence_score: number;
  suggested_filename: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileUrl, originalFilename } = await req.json();

    if (!documentId || !fileUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing documentId or fileUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      console.error('DEEPSEEK_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'DeepSeek API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await supabase
      .from('student_documents')
      .update({ analysis_status: 'processing', original_filename: originalFilename })
      .eq('id', documentId);

    console.log(`Analyzing document: ${documentId}, URL: ${fileUrl}`);

    // Download the image and convert to base64
    let imageBase64 = '';
    let mimeType = 'image/jpeg';
    
    try {
      const imageResponse = await fetch(fileUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      mimeType = contentType.split(';')[0].trim();
      
      const arrayBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      imageBase64 = btoa(binary);
      
      console.log(`Image downloaded successfully, size: ${uint8Array.length} bytes, type: ${mimeType}`);
    } catch (error) {
      console.error('Error downloading image:', error);
      await supabase
        .from('student_documents')
        .update({ analysis_status: 'error' })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download image for analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call DeepSeek Vision API
    const prompt = `Analyze this document image and extract the following information in JSON format:

1. **extracted_text**: All visible text from the document (perform OCR)
2. **detected_type**: Identify the document type from these options: birth_certificate, report_card, id_photo, transcript, medical_record, diploma, recommendation_letter, passport, visa, certificate, enrollment_form, clearance, good_moral, other
3. **summary**: A 2-3 sentence summary of the document content
4. **keywords**: 5-10 relevant keywords for search/filtering (as array)
5. **detected_language**: Primary language of the document (English, Tagalog, Arabic, etc.)
6. **confidence_score**: Your confidence in the analysis (0.0 to 1.0)
7. **suggested_filename**: Generate a meaningful filename based on content (e.g., "Birth_Certificate_John_Doe_2024" or "Report_Card_Grade10_Math_2024")

Respond ONLY with valid JSON, no markdown or extra text:
{
  "extracted_text": "...",
  "detected_type": "...",
  "summary": "...",
  "keywords": ["...", "..."],
  "detected_language": "...",
  "confidence_score": 0.0,
  "suggested_filename": "..."
}`;

    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API error:', deepseekResponse.status, errorText);
      
      await supabase
        .from('student_documents')
        .update({ analysis_status: 'error' })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ success: false, error: `DeepSeek API error: ${deepseekResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deepseekData = await deepseekResponse.json();
    console.log('DeepSeek response received');

    // Parse the response
    let analysis: AnalysisResult;
    try {
      const content = deepseekData.choices[0]?.message?.content || '';
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', parseError);
      console.error('Raw content:', deepseekData.choices[0]?.message?.content);
      
      // Fallback analysis
      analysis = {
        extracted_text: deepseekData.choices[0]?.message?.content || 'Unable to extract text',
        detected_type: 'other',
        summary: 'Document analysis completed with limited results',
        keywords: [],
        detected_language: 'Unknown',
        confidence_score: 0.3,
        suggested_filename: originalFilename || 'document'
      };
    }

    // Generate smart filename with extension from original
    const originalExt = originalFilename?.split('.').pop()?.toLowerCase() || 'jpg';
    const smartFilename = analysis.suggested_filename 
      ? `${analysis.suggested_filename.replace(/\.[^/.]+$/, '')}.${originalExt}`
      : originalFilename || 'document';

    // Update the document with analysis results and smart filename
    const { error: updateError } = await supabase
      .from('student_documents')
      .update({
        extracted_text: analysis.extracted_text,
        detected_type: analysis.detected_type,
        summary: analysis.summary,
        keywords: analysis.keywords,
        detected_language: analysis.detected_language,
        confidence_score: analysis.confidence_score,
        analysis_status: 'completed',
        document_name: smartFilename
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Document ${documentId} analyzed successfully:`, {
      type: analysis.detected_type,
      language: analysis.detected_language,
      confidence: analysis.confidence_score,
      keywordsCount: analysis.keywords.length,
      smartFilename
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysis,
          documentId,
          renamed_to: smartFilename
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
