import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  schoolName: string;
  schoolLogoUrl?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  studentName: string;
  studentLrn: string;
  studentLevel: string;
  orNumber: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  amount: number;
  totalAssessed: number;
  totalDiscount: number;
  netAmount: number;
  totalPaid: number;
  remainingBalance: number;
  notes?: string;
}

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
  };
  const whole = Math.floor(num);
  const cents = Math.round((num - whole) * 100);
  let result = convert(whole) + ' Pesos';
  if (cents > 0) result += ' and ' + cents + '/100';
  return result;
};

const fmt = (n: number) => '₱' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const generateInvoicePDF = async (data: InvoiceData) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  // Try to load logo
  let logoLoaded = false;
  if (data.schoolLogoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = data.schoolLogoUrl!;
      });
      const logoSize = 18;
      doc.addImage(img, 'PNG', pageWidth / 2 - logoSize / 2, y, logoSize, logoSize);
      y += logoSize + 3;
      logoLoaded = true;
    } catch {
      // skip logo if it fails
    }
  }

  // School name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName, pageWidth / 2, y, { align: 'center' });
  y += 6;

  if (data.schoolAddress) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.schoolAddress, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }
  if (data.schoolPhone) {
    doc.setFontSize(8);
    doc.text(data.schoolPhone, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Divider
  y += 2;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('OFFICIAL RECEIPT', pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 10;

  // OR Number and Date row
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`OR No: ${data.orNumber}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Student Info Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', margin + 4, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.studentName}`, margin + 4, y);
  doc.text(`Grade Level: ${data.studentLevel}`, pageWidth / 2, y);
  y += 5;
  doc.text(`LRN: ${data.studentLrn}`, margin + 4, y);
  y += 10;

  // Payment Details Table
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Details']],
    body: [
      ['Payment Method', data.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())],
      ...(data.referenceNumber ? [['Reference Number', data.referenceNumber]] : []),
      ['Amount Paid', fmt(data.amount)],
      ['Amount in Words', numberToWords(data.amount)],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Assessment Summary Table
  autoTable(doc, {
    startY: y,
    head: [['Assessment Summary', 'Amount']],
    body: [
      ['Total Assessed', fmt(data.totalAssessed)],
      ['Less: Discounts', `(${fmt(data.totalDiscount)})`],
      ['Net Amount Due', fmt(data.netAmount)],
      ['Total Paid to Date', fmt(data.totalPaid)],
      ['Remaining Balance', fmt(data.remainingBalance)],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'right' },
    },
    didParseCell: (hookData) => {
      // Bold the balance row
      if (hookData.section === 'body' && hookData.row.index === 4) {
        hookData.cell.styles.fontStyle = 'bold';
        if (data.remainingBalance <= 0) {
          hookData.cell.styles.textColor = [39, 174, 96];
        } else {
          hookData.cell.styles.textColor = [192, 57, 43];
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Fully paid badge
  if (data.remainingBalance <= 0) {
    doc.setFillColor(39, 174, 96);
    doc.roundedRect(pageWidth / 2 - 22, y, 44, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ FULLY PAID', pageWidth / 2, y + 5.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 14;
  } else {
    y += 4;
  }

  if (data.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Notes: ${data.notes}`, margin, y);
    y += 6;
  }

  // Footer divider
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your payment!', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  doc.text('This is a system-generated receipt.', pageWidth / 2, y + 4, { align: 'center' });

  doc.save(`Invoice-${data.orNumber}.pdf`);
};
