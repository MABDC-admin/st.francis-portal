import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface StudentData {
    student_name: string;
    lrn: string;
    level: string;
    gender: string | null;
    age: number | null;
    birth_date: string | null;
    mother_maiden_name: string | null;
    mother_contact: string | null;
    father_name: string | null;
    father_contact: string | null;
    phil_address: string | null;
    uae_address: string | null;
    previous_school: string | null;
    school: string | null;
}

interface SchoolMetadata {
    schoolName: string;
    schoolId: string;
    region: string;
    division: string;
    district: string;
}

export const generateAnnex1 = (student: StudentData, school: SchoolMetadata) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // --- HEADER (Official DepEd Style) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Annex 1', pageWidth - 25, margin + 5);

    // Graphical Seal Placeholders
    const drawSealPlaceholder = (x: number, y: number, label: string) => {
        doc.setDrawColor(200, 200, 200);
        doc.circle(x, y, 12, 'D');
        doc.setFontSize(6);
        doc.text(label, x, y, { align: 'center' });
    };

    drawSealPlaceholder(margin + 15, margin + 15, 'Republic of\nthe Philippines');
    drawSealPlaceholder(pageWidth - margin - 15, margin + 15, 'Department\nof Education');

    doc.setFontSize(10);
    doc.text('Republic of the Philippines', pageWidth / 2, margin + 10, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Department of Education', pageWidth / 2, margin + 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('BASIC EDUCATION ENROLLMENT FORM', pageWidth / 2, margin + 25, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('THIS FORM IS NOT FOR SALE', pageWidth / 2, margin + 30, { align: 'center' });

    // --- SCHOOL YEAR & INFO ---
    let currentY = margin + 40;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const syStart = currentMonth < 5 ? currentYear - 1 : currentYear;
    const syEnd = syStart + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`School Year: ${syStart}-${syEnd}`, margin, currentY);

    // Checkbox styling for New/Returning/Transferee
    const drawCheckbox = (x: number, y: number, checked: boolean) => {
        doc.rect(x, y - 3, 3, 3);
        if (checked) {
            doc.line(x, y - 3, x + 3, y);
            doc.line(x + 3, y - 3, x, y);
        }
    };

    drawCheckbox(margin + 60, currentY, false);
    doc.text('New Enrollee', margin + 65, currentY);
    drawCheckbox(margin + 90, currentY, true);
    doc.text('Returning', margin + 95, currentY);
    drawCheckbox(margin + 120, currentY, false);
    doc.text('Transferee', margin + 125, currentY);

    currentY += 8;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, currentY, contentWidth, 20, 'FD'); // Box for school info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('SCHOOL INFORMATION', margin + 2, currentY + 4);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('School Name: __________________________________________________', margin + 2, currentY + 10);
    doc.text('School ID: ____________', margin + 120, currentY + 10);
    doc.text('Region: _______________', margin + 2, currentY + 16);
    doc.text('Division: _______________', margin + 50, currentY + 16);
    doc.text('District: _______________', margin + 120, currentY + 16);

    // --- STUDENT INFORMATION SECTION ---
    currentY += 25;
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(31, 41, 55); // Dark slate header
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.text('STUDENT INFORMATION', margin + 2, currentY + 5);
    doc.setTextColor(0, 0, 0);

    currentY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Learner Reference Number (LRN)', margin, currentY - 5);

    // Draw LRN as simple text on a line instead of blocks
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text(student.lrn, margin + 2, currentY);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, currentY + 1, margin + 100, currentY + 1);

    currentY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NAME OF LEARNER:', margin, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${student.student_name.toUpperCase()}`, margin + 2, currentY);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, currentY + 1, margin + contentWidth, currentY + 1);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('(Last Name, First Name, Middle Name)', margin, currentY + 4);

    currentY += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Grid for Birthdate, Sex, Age
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY - 4, 60, 10);
    doc.text('Birthdate', margin + 2, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(student.birth_date ? format(new Date(student.birth_date), 'MMMM dd, yyyy') : 'N/A', margin + 2, currentY + 2);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 65, currentY - 4, 30, 10);
    doc.text('Sex', margin + 67, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(student.gender || 'N/A', margin + 67, currentY + 2);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 100, currentY - 4, 20, 10);
    doc.text('Age', margin + 102, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.age || 'N/A'}`, margin + 102, currentY + 2);

    currentY += 12;
    doc.setFont('helvetica', 'normal');
    doc.text('Indigenous Peoples (IP):', margin, currentY);
    drawCheckbox(margin + 45, currentY, false);
    doc.text('Yes', margin + 50, currentY);
    drawCheckbox(margin + 60, currentY, true);
    doc.text('No', margin + 65, currentY);

    doc.text('4Ps Beneficiary:', margin + 90, currentY);
    drawCheckbox(margin + 125, currentY, false);
    doc.text('Yes', margin + 130, currentY);
    drawCheckbox(margin + 140, currentY, true);
    doc.text('No', margin + 145, currentY);

    // --- ADDRESS SECTION ---
    currentY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(31, 41, 55);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.text('PERMANENT ADDRESS', margin + 2, currentY + 5);
    doc.setTextColor(0, 0, 0);

    currentY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${student.phil_address || 'N/A'}`, margin + 2, currentY);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, currentY + 1, margin + contentWidth, currentY + 1);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('(Street, Barangay, Municipality/City, Province, Country)', margin, currentY + 4);

    // --- PARENT / GUARDIAN SECTION ---
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(31, 41, 55);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.text('PARENT / GUARDIAN INFORMATION', margin + 2, currentY + 5);
    doc.setTextColor(0, 0, 0);

    currentY += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY - 4, 100, 10);
    doc.text(`Father's Full Name`, margin + 2, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.father_name || 'N/A'}`, margin + 2, currentY + 2);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 105, currentY - 4, 75, 10);
    doc.text('Contact Number', margin + 107, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.father_contact || 'N/A'}`, margin + 107, currentY + 2);

    currentY += 15;
    doc.setFont('helvetica', 'normal');
    doc.rect(margin, currentY - 4, 100, 10);
    doc.text(`Mother's Full Maiden Name`, margin + 2, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.mother_maiden_name || 'N/A'}`, margin + 2, currentY + 2);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 105, currentY - 4, 75, 10);
    doc.text('Contact Number', margin + 107, currentY - 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.mother_contact || 'N/A'}`, margin + 107, currentY + 2);

    // --- EDUCATIONAL BACKGROUND ---
    currentY += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(31, 41, 55);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.text('EDUCATIONAL BACKGROUND', margin + 2, currentY + 5);
    doc.setTextColor(0, 0, 0);

    currentY += 12;
    doc.setFont('helvetica', 'normal');
    doc.text('Last School Attended:', margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.previous_school || 'N/A'}`, margin + 40, currentY);
    doc.line(margin + 40, currentY + 1, margin + 140, currentY + 1);

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Last Grade Level Completed:', margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.level}`, margin + 50, currentY);
    doc.line(margin + 50, currentY + 1, margin + 80, currentY + 1);

    // --- CERTIFICATION ---
    currentY += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION', margin, currentY);
    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const certText = 'I hereby certify that the above information given is true and correct to the best of my knowledge and I allow the Department of Education to use my child\'s details to create and/or update his/her profile in the Learner Information System. The herein provided information shall be treated as confidential in compliance with the Data Privacy Act of 2012.';
    doc.text(doc.splitTextToSize(certText, contentWidth), margin, currentY);

    currentY += 25;
    doc.line(margin + 10, currentY, margin + 80, currentY);
    doc.line(margin + 110, currentY, margin + 180, currentY);
    doc.text('Signature Over Printed Name of Parent/Guardian', margin + 10, currentY + 4);
    doc.text('Date', margin + 140, currentY + 4);

    // Save the PDF
    doc.save(`Annex1_${student.student_name.replace(/\s+/g, '_')}.pdf`);
};
