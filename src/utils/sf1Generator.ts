import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface StudentData {
    student_name: string;
    lrn: string;
    gender: string | null;
    birth_date: string | null;
    age: number | null;
    phil_address: string | null;
    father_name: string | null;
    mother_maiden_name: string | null;
    father_contact: string | null;
    mother_contact: string | null;
    level: string;
    school: string | null;
}

interface SchoolMetadata {
    schoolName: string;
    schoolId: string;
    region: string;
    division: string;
    district: string;
}

export const generateSF1 = (student: StudentData, school: SchoolMetadata) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('School Form 1 (SF1) Register of Learners', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Region: ${school.region}`, 15, 25);
    doc.text(`Division: ${school.division}`, 15, 30);
    doc.text(`District: ${school.district}`, 15, 35);

    doc.text(`School Name: ${school.schoolName}`, pageWidth / 2, 25, { align: 'center' });
    doc.text(`School ID: ${school.schoolId}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`School Year: ${format(new Date(), 'yyyy')}-${parseInt(format(new Date(), 'yyyy')) + 1}`, pageWidth / 2, 35, { align: 'center' });

    doc.text(`Grade Level: ${student.level}`, pageWidth - 15, 25, { align: 'right' });
    doc.text(`Section: N/A`, pageWidth - 15, 30, { align: 'right' });

    // Student Data Table
    const tableData = [
        [
            student.lrn,
            student.student_name,
            student.gender ? (student.gender.toLowerCase() === 'male' ? 'M' : 'F') : '',
            student.birth_date ? format(new Date(student.birth_date), 'MM/dd/yyyy') : '',
            student.age?.toString() || '',
            'Filipino', // Mother Tongue placeholder
            'N/A', // Ethnic Group placeholder
            'N/A', // Religion placeholder
            student.phil_address || 'N/A',
            student.father_name || '',
            student.mother_maiden_name || '',
            'N/A', // Guardian placeholder
            'N/A', // Relationship placeholder
            student.father_contact || student.mother_contact || '',
            '' // Remarks
        ]
    ];

    autoTable(doc, {
        startY: 45,
        head: [[
            'LRN',
            'NAME (Last Name, First Name, Middle Name)',
            'SEX',
            'BIRTH DATE (mm/dd/yyyy)',
            'AGE',
            'MOTHER TONGUE',
            'IP (Ethnic Group)',
            'RELIGION',
            'ADDRESS',
            'FATHER\'S NAME',
            'MOTHER\'S MAIDEN NAME',
            'GUARDIAN',
            'RELATIONSHIP',
            'CONTACT NUMBER',
            'REMARKS'
        ]],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: 2,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
        },
        columnStyles: {
            1: { halign: 'left', minCellWidth: 40 }, // Name
            8: { halign: 'left', minCellWidth: 40 }, // Address
            9: { halign: 'left' }, // Father
            10: { halign: 'left' } // Mother
        },
        margin: { left: 10, right: 10 }
    });

    // Footer / Certification
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('Prepared by:', 15, finalY);
    doc.text('__________________________', 15, finalY + 10);
    doc.text('Class Adviser', 15, finalY + 15);

    doc.text('Certified Correct:', pageWidth / 2, finalY);
    doc.text('__________________________', pageWidth / 2, finalY + 10, { align: 'center' });
    doc.text('School Head', pageWidth / 2, finalY + 15, { align: 'center' });

    // Save PDF
    doc.save(`SF1_${student.student_name.replace(/\s+/g, '_')}.pdf`);
};
