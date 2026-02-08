import jsPDF from 'jspdf';

/**
 * Exports an AI chat response to a formatted PDF document.
 * Handles markdown-style content by stripping formatting and laying out text cleanly.
 */
export function exportResponseToPdf(content: string, documentName?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 25;
  const marginBottom = 20;
  const usableWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  // Header
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('AI Chat Response', marginLeft, 10);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - marginRight, 10, { align: 'right' });

  if (documentName) {
    doc.setFontSize(7);
    doc.text(`Source: ${documentName}`, marginLeft, 15);
  }

  // Line under header
  doc.setDrawColor(220, 220, 220);
  doc.line(marginLeft, 18, pageWidth - marginRight, 18);
  y = 25;

  // Process content line by line
  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip empty lines but add spacing
    if (line.trim() === '') {
      y += 3;
      continue;
    }

    // Heading detection (markdown)
    if (line.startsWith('### ')) {
      addNewPageIfNeeded(10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      const text = line.replace(/^###\s+/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(text, usableWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 5 + 3;
      continue;
    }

    if (line.startsWith('## ')) {
      addNewPageIfNeeded(12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      const text = line.replace(/^##\s+/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(text, usableWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 6 + 4;
      continue;
    }

    if (line.startsWith('# ')) {
      addNewPageIfNeeded(14);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      const text = line.replace(/^#\s+/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(text, usableWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 7 + 5;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      addNewPageIfNeeded(6);
      doc.setDrawColor(200, 200, 200);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 4;
      continue;
    }

    // Bullet points
    if (line.match(/^\s*[-*+]\s/)) {
      const indent = line.search(/\S/);
      const bulletIndent = marginLeft + Math.min(indent, 4) * 3;
      const text = line.replace(/^\s*[-*+]\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      const wrapped = doc.splitTextToSize(text, usableWidth - (bulletIndent - marginLeft) - 5);
      addNewPageIfNeeded(wrapped.length * 4.5);

      doc.text('•', bulletIndent, y);
      doc.text(wrapped, bulletIndent + 5, y);
      y += wrapped.length * 4.5 + 1.5;
      continue;
    }

    // Numbered list
    if (line.match(/^\s*\d+\.\s/)) {
      const match = line.match(/^(\s*)(\d+\.)\s+(.*)/);
      if (match) {
        const num = match[2];
        const text = match[3].replace(/\*\*/g, '').replace(/\*/g, '');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);

        const wrapped = doc.splitTextToSize(text, usableWidth - 10);
        addNewPageIfNeeded(wrapped.length * 4.5);

        doc.setFont('helvetica', 'bold');
        doc.text(num, marginLeft, y);
        doc.setFont('helvetica', 'normal');
        doc.text(wrapped, marginLeft + 10, y);
        y += wrapped.length * 4.5 + 1.5;
        continue;
      }
    }

    // Regular paragraph text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    // Strip markdown formatting
    const cleanText = line
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1');

    const wrapped = doc.splitTextToSize(cleanText, usableWidth);
    addNewPageIfNeeded(wrapped.length * 4.5);
    doc.text(wrapped, marginLeft, y);
    y += wrapped.length * 4.5 + 1;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Generated by AI Chat', marginLeft, pageHeight - 10);
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeName = documentName ? documentName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30) : 'response';
  doc.save(`AI_${safeName}_${timestamp}.pdf`);
}
