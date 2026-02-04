import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Grade {
    subject_code: string;
    subject_name: string;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    final: number | null;
    remarks: string | null;
}

interface StudentData {
    student_name: string;
    lrn: string;
    level: string;
    gender: string | null;
    age: number | null;
    school: string | null;
}

export const generateSF9 = (student: StudentData, grades: Grade[], academicYear: string) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // --- HEADER (Official DepEd Style) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SF 9-ES', pageWidth - 25, margin + 5);

    // Graphical Seal Placeholders (Same style as Annex 1 for consistency)
    const drawSealPlaceholder = (x: number, y: number, label: string) => {
        doc.setDrawColor(200, 200, 200);
        doc.circle(x, y, 12, 'D');
        doc.setFontSize(6);
        doc.text(label, x, y, { align: 'center' });
    };

    drawSealPlaceholder(margin + 15, margin + 15, 'Republic of\nthe Philippines');
    drawSealPlaceholder(pageWidth - margin - 15, margin + 15, 'Department\nof Education');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Republic of the Philippines', pageWidth / 2, margin + 10, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Department of Education', pageWidth / 2, margin + 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('LEARNER\'S PROGRESS REPORT CARD', pageWidth / 2, margin + 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`School Year: ${academicYear}`, pageWidth / 2, margin + 30, { align: 'center' });

    // --- STUDENT INFO ---
    let currentY = margin + 45;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('LEARNER INFORMATION', margin, currentY);
    doc.setDrawColor(31, 41, 55);
    doc.line(margin, currentY + 1, margin + 40, currentY + 1);

    currentY += 8;
    doc.setFont('helvetica', 'normal');

    // Grid-style info boxes
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, currentY, 100, 10);
    doc.text('Name', margin + 2, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(student.student_name.toUpperCase(), margin + 2, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 105, currentY, 75, 10);
    doc.text('LRN', margin + 107, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(student.lrn, margin + 107, currentY + 8);

    currentY += 15;
    doc.setFont('helvetica', 'normal');
    doc.rect(margin, currentY, 40, 10);
    doc.text('Grade Level', margin + 2, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(student.level, margin + 2, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 45, currentY, 40, 10);
    doc.text('Section', margin + 47, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('Beryl', margin + 47, currentY + 8); // Generic placeholder section

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 90, currentY, 45, 10);
    doc.text('Age', margin + 92, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.age || 'N/A'}`, margin + 92, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.rect(margin + 140, currentY, 40, 10);
    doc.text('Sex', margin + 142, currentY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(student.gender || 'N/A', margin + 142, currentY + 8);

    // --- REPORT ON LEARNING PROGRESS AND ACHIEVEMENT ---
    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT ON LEARNING PROGRESS AND ACHIEVEMENT', margin, currentY);

    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Learning Areas', '1', '2', '3', '4', 'Final Rating', 'Remarks']],
        body: grades.map(g => [
            g.subject_name,
            g.q1 || '',
            g.q2 || '',
            g.q3 || '',
            g.q4 || '',
            g.final || '',
            g.remarks || (g.final && g.final >= 75 ? 'PASSED' : g.final ? 'FAILED' : '')
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: [31, 41, 55],
            textColor: [255, 255, 255],
            fontSize: 8,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 15 },
            5: { halign: 'center', cellWidth: 25 },
            6: { halign: 'center' }
        },
        foot: [[
            'GENERAL AVERAGE',
            '', '', '', '',
            grades.some(g => g.final)
                ? (grades.reduce((acc, g) => acc + (g.final || 0), 0) / grades.filter(g => g.final).length).toFixed(0)
                : '',
            ''
        ]],
        footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        }
    });

    // --- REPORT ON LEARNER'S OBSERVED VALUES ---
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT ON LEARNER\'S OBSERVED VALUES', margin, finalY);

    finalY += 5;
    autoTable(doc, {
        startY: finalY,
        margin: { left: margin, right: margin },
        head: [['Core Values', 'Behavior Statements', '1', '2', '3', '4']],
        body: [
            ['1. Maka-Diyos', 'Expresses one\'s spiritual beliefs while respecting the spiritual beliefs of others.', '', '', '', ''],
            ['2. Makatao', 'Is sensitive to individual, social, and cultural differences.', '', '', '', ''],
            ['3. Makakalikasan', 'Cares for the environment and utilizes resources wisely, judiciously, and economically.', '', '', '', ''],
            ['4. Makabansa', 'Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen.', '', '', '', '']
        ],
        theme: 'grid',
        headStyles: {
            fillColor: [100, 100, 100],
            textColor: [255, 255, 255],
            fontSize: 7,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 7
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 30 },
            1: { cellWidth: 100 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' }
        }
    });

    // --- SIGNATURES ---
    finalY = (doc as any).lastAutoTable.finalY + 25;
    doc.line(margin + 10, finalY, margin + 70, finalY);
    doc.line(pageWidth - margin - 70, finalY, pageWidth - margin - 10, finalY);

    doc.setFontSize(8);
    doc.text('Parent/Guardian Signature', margin + 40, finalY + 4, { align: 'center' });
    doc.text('Class Adviser', pageWidth - margin - 40, finalY + 4, { align: 'center' });

    currentY = finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION', pageWidth / 2, currentY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('This is to certify that this report card is the official progress report of the learner for the specified school year.', pageWidth / 2, currentY + 5, { align: 'center' });

    // Save the PDF
    doc.save(`SF9_ReportCard_${student.student_name.replace(/\s+/g, '_')}.pdf`);
};
