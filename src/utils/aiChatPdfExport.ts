import jsPDF from 'jspdf';

// Section emoji → color mapping
const SECTION_COLORS: Record<string, [number, number, number]> = {
  '📘': [59, 130, 246],   // Blue - Topic
  '🧠': [139, 92, 246],   // Purple - Explanation
  '✅': [34, 197, 94],    // Green - Answer
  '📝': [249, 115, 22],   // Orange - Steps
  '💡': [234, 179, 8],    // Yellow - Tip
  '⚠️': [239, 68, 68],   // Red - Warning
  '🔧': [107, 114, 128],  // Gray - Technical
  '📊': [20, 184, 166],   // Teal - Analysis
  '🎥': [239, 68, 68],    // Red - Video
  '📚': [59, 130, 246],   // Blue - Sources
};

function getSectionColor(line: string): [number, number, number] | null {
  for (const [emoji, color] of Object.entries(SECTION_COLORS)) {
    if (line.includes(emoji)) return color;
  }
  return null;
}

function isYouTubeUrl(text: string): string | null {
  const match = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\S+/);
  return match ? match[0] : null;
}

/**
 * Exports an AI chat response to a formatted PDF document with icons and styled sections.
 */
export function exportResponseToPdf(content: string, documentName?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const marginBottom = 20;

  let y = 0;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      y = 18;
    }
  };

  // ── Header Banner ──
  // Accent bar
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // SchoolAI branding
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('SchoolAI', marginLeft, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - marginRight, 12, { align: 'right' });

  if (documentName) {
    doc.setFontSize(7);
    doc.text(`Source: ${documentName}`, marginLeft, 17);
  }

  // Decorative separator
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 20, pageWidth - marginRight, 20);
  y = 27;

  // ── Process content ──
  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      y += 3;
      continue;
    }

    // ── Section header with emoji icon ──
    const sectionColor = getSectionColor(line);
    const isSectionHeader = sectionColor && (line.includes('**') || line.startsWith('#'));

    if (isSectionHeader) {
      addNewPageIfNeeded(12);
      const [r, g, b] = sectionColor;

      // Draw colored circle indicator
      doc.setFillColor(r, g, b);
      doc.circle(marginLeft + 1.5, y - 1.2, 1.5, 'F');

      // Header text in matching color
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(r, g, b);
      const text = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      const wrapped = doc.splitTextToSize(text, usableWidth - 8);
      doc.text(wrapped, marginLeft + 6, y);
      y += wrapped.length * 5;

      // Thin colored underline
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, y + 0.5, marginLeft + 50, y + 0.5);
      y += 4;
      continue;
    }

    // ── Heading detection (markdown) ──
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

    // ── Horizontal rule → decorative colored separator ──
    if (line.match(/^[-*_]{3,}$/)) {
      addNewPageIfNeeded(6);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 4;
      continue;
    }

    // ── YouTube URL detection ──
    const youtubeUrl = isYouTubeUrl(line);
    if (youtubeUrl) {
      addNewPageIfNeeded(10);
      // VIDEO label
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(marginLeft, y - 3, 14, 4.5, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('VIDEO', marginLeft + 1.5, y);

      // Link text
      const linkText = line.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim();
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(linkText || 'Watch on YouTube', marginLeft + 16, y);
      y += 4.5;

      // URL reference
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      const truncatedUrl = youtubeUrl.length > 80 ? youtubeUrl.slice(0, 77) + '...' : youtubeUrl;
      doc.text(truncatedUrl, marginLeft + 5, y);
      y += 4;
      continue;
    }

    // ── Bullet points ──
    if (line.match(/^\s*[-*+]\s/)) {
      const indent = line.search(/\S/);
      const bulletIndent = marginLeft + Math.min(indent, 4) * 3;
      const text = line.replace(/^\s*[-*+]\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '');
      // Check for markdown links
      const cleanText = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const wrapped = doc.splitTextToSize(cleanText, usableWidth - (bulletIndent - marginLeft) - 5);
      addNewPageIfNeeded(wrapped.length * 4.5);
      doc.text('•', bulletIndent, y);
      doc.text(wrapped, bulletIndent + 5, y);
      y += wrapped.length * 4.5 + 1.5;
      continue;
    }

    // ── Numbered list ──
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

    // ── Regular paragraph ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
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

  // ── Footer on each page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Accent line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);
    // SchoolAI branding
    doc.setFontSize(7);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('SchoolAI', marginLeft, pageHeight - 10);
    // Page number
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Generated by SchoolAI', pageWidth - marginRight, pageHeight - 10, { align: 'right' });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeName = documentName ? documentName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30) : 'response';
  doc.save(`SchoolAI_${safeName}_${timestamp}.pdf`);
}
