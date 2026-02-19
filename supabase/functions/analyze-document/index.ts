/**
 * analyze-document — Standardized with shared utilities
 *
 * Uses Lovable AI (Gemini) to analyze student documents (ocr, classification, summary).
 * Delegates to process-pdf if document is a PDF.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

interface AnalysisResult {
  extracted_text: string;
  detected_type: string;
  summary: string;
  keywords: string[];
  detected_language: string;
  confidence_score: number;
  suggested_filename: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { documentId, fileUrl, originalFilename, studentId } = await req.json();

    if (!documentId || !fileUrl) {
      return errorResponse('Missing documentId or fileUrl', 400, 'MISSING_PARAMS');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return errorResponse('Lovable AI key not configured', 500, 'CONFIG_ERROR');
    }

    const supabase = createServiceClient();

    // Check if PDF
    const isPDF = fileUrl.toLowerCase().endsWith('.pdf') ||
      originalFilename?.toLowerCase().endsWith('.pdf');

    if (isPDF && studentId) {
      console.log('Detected PDF, delegating to process-pdf function');

      await supabase
        .from('student_documents')
        .update({ analysis_status: 'processing', original_filename: originalFilename })
        .eq('id', documentId);

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/process-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ documentId, fileUrl, studentId, originalFilename })
      });

      const pdfResult = await pdfResponse.json();
      return jsonResponse({ success: pdfResult.success, isPDF: true, ...pdfResult });
    }

    // Process Image
    await supabase
      .from('student_documents')
      .update({ analysis_status: 'processing', original_filename: originalFilename })
      .eq('id', documentId);

    console.log(`Analyzing document: ${documentId}, URL: ${fileUrl}`);

    let imageBase64 = '';
    let mimeType = 'image/jpeg';

    try {
      const imageResponse = await fetch(fileUrl);
      if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);

      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      mimeType = contentType.split(';')[0].trim();

      const arrayBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      imageBase64 = btoa(binary);
    } catch (error) {
      console.error('Error downloading image:', error);
      await supabase.from('student_documents').update({ analysis_status: 'error' }).eq('id', documentId);
      return errorResponse('Failed to download image', 500, 'DOWNLOAD_ERROR');
    }

    const prompt = `Analyze this document image and extract the following information in JSON format:

1. **extracted_text**: All visible text from the document (perform OCR)
2. **detected_type**: Identify the document type (birth_certificate, report_card, id_photo, transcript, medical_record, etc.)
3. **summary**: A 2-3 sentence summary
4. **keywords**: 5-10 relevant keywords
5. **detected_language**: Primary language
6. **confidence_score**: Confidence (0.0 to 1.0)
7. **suggested_filename**: Generate a meaningful filename

Respond ONLY with valid JSON.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!aiResponse.ok) {
      await supabase.from('student_documents').update({ analysis_status: 'error' }).eq('id', documentId);
      const status = aiResponse.status;
      if (status === 429) return errorResponse('Rate limit exceeded', 429);
      if (status === 402) return errorResponse('AI credits exhausted', 402);
      return errorResponse(`AI analysis error: ${status}`, 500);
    }

    const aiData = await aiResponse.json();
    let analysis: AnalysisResult;

    try {
      const content = aiData.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        extracted_text: aiData.choices[0]?.message?.content || 'Unable to extract text',
        detected_type: 'other',
        summary: 'Document analysis completed with limited results',
        keywords: [],
        detected_language: 'Unknown',
        confidence_score: 0.3,
        suggested_filename: originalFilename || 'document'
      };
    }

    const originalExt = originalFilename?.split('.').pop()?.toLowerCase() || 'jpg';
    const smartFilename = analysis.suggested_filename
      ? `${analysis.suggested_filename.replace(/\.[^/.]+$/, '')}.${originalExt}`
      : originalFilename || 'document';

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
      return errorResponse('Failed to save analysis results', 500, 'DB_ERROR');
    }

    return jsonResponse({
      success: true,
      analysis: { ...analysis, documentId, renamed_to: smartFilename }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Unexpected error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
