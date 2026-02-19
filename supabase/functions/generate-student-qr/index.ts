/**
 * generate-student-qr — Standardized with shared utilities
 *
 * Generates a QR code for a student containing their LRN, temp password,
 * and school code. Returns a data URL for the QR image.
 */
import QRCode from 'npm:qrcode@1.5.4';
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
  parseRequiredFields,
} from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Parse request
    const body = await parseRequiredFields<{ student_id: string }>(req, ['student_id']);
    if (body.error) return body.error;

    const { student_id } = body.data!;
    console.log(`Generating QR code for student: ${student_id}`);

    const supabase = createServiceClient();

    // 2. Fetch student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('lrn, student_name, school_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return errorResponse('Student not found', 404, 'NOT_FOUND');
    }

    // 3. Fetch credentials
    const { data: creds } = await supabase
      .from('user_credentials')
      .select('temp_password')
      .eq('student_id', student_id)
      .maybeSingle();

    // 4. Get school code
    let schoolCode = '';
    if (student.school_id) {
      const { data: school } = await supabase
        .from('schools')
        .select('code')
        .eq('id', student.school_id)
        .single();
      schoolCode = school?.code || '';
    }

    // 5. Generate QR
    const qrPayload = JSON.stringify({
      lrn: student.lrn || '',
      password: creds?.temp_password || '',
      school: schoolCode,
      generated: new Date().toISOString(),
    });

    console.log(`QR payload built for ${student.student_name}, generating image...`);

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });

    console.log('QR code generated successfully');

    return jsonResponse({ qr_data_url: qrDataUrl });
  } catch (error) {
    const err = error as Error;
    console.error('QR generation error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
