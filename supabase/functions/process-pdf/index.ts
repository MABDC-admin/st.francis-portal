/**
 * process-pdf — Standardized with shared utilities
 *
 * Download PDF, splits into pages, uploads page images/PDFs, and triggers analysis.
 * Uses pdf-lib for PDF manipulation.
 */
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { documentId, fileUrl, studentId, originalFilename } = await req.json();

    if (!documentId || !fileUrl || !studentId) {
      return errorResponse('Missing required parameters', 400, 'MISSING_PARAMS');
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      return errorResponse('DeepSeek API key not configured', 500, 'CONFIG_ERROR');
    }

    const supabase = createServiceClient();

    await supabase
      .from('student_documents')
      .update({ analysis_status: 'processing', original_filename: originalFilename })
      .eq('id', documentId);

    console.log(`Processing PDF: ${documentId}, URL: ${fileUrl}`);

    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    console.log(`PDF downloaded: ${pdfBytes.length} bytes`);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);

    const pageImages: { page: number; url: string; thumbnail_url: string }[] = [];

    // Process pages (limit 20)
    for (let i = 0; i < Math.min(pageCount, 20); i++) {
      const pageNum = i + 1;
      console.log(`Processing page ${pageNum}/${pageCount}`);

      try {
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
        singlePagePdf.addPage(copiedPage);
        const singlePageBytes = await singlePagePdf.save();

        const pageFileName = `${studentId}/${documentId}/page-${pageNum}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('student-documents')
          .upload(pageFileName, singlePageBytes, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error(`Failed to upload page ${pageNum}:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('student-documents')
          .getPublicUrl(pageFileName);

        const pageUrl = urlData.publicUrl;

        pageImages.push({
          page: pageNum,
          url: pageUrl,
          thumbnail_url: pageUrl
        });

        // Create child document record
        const { data: pageDoc, error: pageDocError } = await supabase
          .from('student_documents')
          .insert({
            student_id: studentId,
            parent_document_id: documentId,
            is_pdf_page: true,
            page_number: pageNum,
            slot_number: 0,
            document_name: `${originalFilename || 'Document'} - Page ${pageNum}`,
            document_type: 'application/pdf',
            file_url: pageUrl,
            thumbnail_url: pageUrl,
            analysis_status: 'pending'
          })
          .select()
          .single();

        if (pageDocError) {
          console.error(`Failed to create page record ${pageNum}:`, pageDocError);
        } else if (pageDoc) {
          console.log(`Created page record: ${pageDoc.id}`);
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
      }
    }

    // Update parent document
    const { error: updateError } = await supabase
      .from('student_documents')
      .update({
        page_count: pageCount,
        page_images: pageImages,
        analysis_status: 'completed',
        thumbnail_url: pageImages[0]?.thumbnail_url || null,
        detected_type: 'multi_page_document',
        summary: `Multi-page PDF document with ${pageCount} pages`,
        keywords: ['pdf', 'multi-page']
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update parent document:', updateError);
    }

    console.log(`PDF processing complete: ${pageCount} pages processed`);

    return jsonResponse({
      success: true,
      pageCount,
      pagesProcessed: pageImages.length,
      message: `PDF split into ${pageImages.length} pages for AI analysis`
    });

  } catch (error) {
    const err = error as Error;
    console.error('PDF processing error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
