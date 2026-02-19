import jsPDF from 'jspdf';

interface ExportOptions {
  title?: string;
  content: string;
  filename?: string;
}

export function exportNotebookToPdf({ title, content, filename }: ExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 10;
  }

  // Add timestamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition);
  yPosition += 15;
  doc.setTextColor(0, 0, 0);

  // Parse and render markdown content
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Heading 1
    if (line.startsWith('# ')) {
      checkPageBreak(15);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(2);
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 7 + 5;
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      checkPageBreak(12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(3);
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 6 + 4;
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      checkPageBreak(10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(4);
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5 + 3;
    }
    // Bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const text = '• ' + line.substring(2);
      const splitText = doc.splitTextToSize(text, contentWidth - 5);
      doc.text(splitText, margin + 5, yPosition);
      yPosition += splitText.length * 5 + 2;
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(line, contentWidth - 5);
      doc.text(splitText, margin + 5, yPosition);
      yPosition += splitText.length * 5 + 2;
    }
    // Code block (inline)
    else if (line.startsWith('```') || line.startsWith('`')) {
      // Skip code fences, render content as monospace
      if (!line.startsWith('```')) {
        checkPageBreak(8);
        doc.setFontSize(10);
        doc.setFont('courier', 'normal');
        doc.setFillColor(245, 245, 245);
        const splitText = doc.splitTextToSize(line.replace(/`/g, ''), contentWidth - 10);
        const boxHeight = splitText.length * 5 + 4;
        doc.rect(margin, yPosition - 4, contentWidth, boxHeight, 'F');
        doc.text(splitText, margin + 3, yPosition);
        yPosition += boxHeight + 2;
        doc.setFont('helvetica', 'normal');
      }
    }
    // Bold text (simple handling)
    else if (line.includes('**')) {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const text = line.replace(/\*\*/g, '');
      const splitText = doc.splitTextToSize(text, contentWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5 + 3;
      doc.setFont('helvetica', 'normal');
    }
    // Empty line
    else if (line.trim() === '') {
      yPosition += 4;
    }
    // Regular paragraph
    else {
      checkPageBreak(8);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(line, contentWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5 + 3;
    }
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Download the PDF
  const exportFilename = filename || `notebook-export-${Date.now()}.pdf`;
  doc.save(exportFilename);
}
