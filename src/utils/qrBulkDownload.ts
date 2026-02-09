import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentQRInfo {
    id: string;
    name: string;
}

export const downloadBulkQRCodes = async (students: StudentQRInfo[]) => {
    if (students.length === 0) {
        toast.error('No learners selected for QR download');
        return;
    }

    const zip = new JSZip();
    const folder = zip.folder('student_qr_codes');

    toast.info(`Preparing ${students.length} QR codes...`);

    const results = await Promise.allSettled(
        students.map(async (student) => {
            try {
                const { data, error } = await supabase.functions.invoke('generate-student-qr', {
                    body: { student_id: student.id },
                });

                if (error) throw error;
                if (!data?.qr_data_url) throw new Error('No QR data returned');

                // Extract base64 content from data URL
                const base64Data = data.qr_data_url.split(',')[1];

                // Add to zip folder with student name as filename
                // Remove special characters from filename to be safe
                const safeName = student.name.replace(/[/\\?%*:|"<>]/g, '-');
                folder?.file(`${safeName}.png`, base64Data, { base64: true });

                return { success: true, name: student.name };
            } catch (err) {
                console.error(`Error generating QR for ${student.name}:`, err);
                return { success: false, name: student.name };
            }
        })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = students.length - successful;

    if (successful > 0) {
        toast.info('Generating ZIP archive...');
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `Student_QR_Codes_${new Date().toISOString().split('T')[0]}.zip`);

        if (failed > 0) {
            toast.warning(`Downloaded ${successful} QR codes. ${failed} failed.`);
        } else {
            toast.success(`Successfully developed ${successful} QR codes!`);
        }
    } else {
        toast.error('Failed to generate any QR codes');
    }
};
