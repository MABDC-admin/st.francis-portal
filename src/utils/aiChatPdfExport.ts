import jsPDF from 'jspdf';
import type { ChatImage } from '@/components/aichat/types';

// ── Section emoji → color mapping ──
const SECTION_COLORS: Record<string, [number, number, number]> = {
  '📘': [59, 130, 246],
  '🧠': [139, 92, 246],
  '✅': [34, 197, 94],
  '📝': [249, 115, 22],
  '💡': [234, 179, 8],
  '⚠️': [239, 68, 68],
  '🔧': [107, 114, 128],
  '📊': [20, 184, 166],
  '🎥': [239, 68, 68],
  '📚': [59, 130, 246],
};

// ── Helpers ──

function getSectionColor(line: string): [number, number, number] | null {
  for (const [emoji, color] of Object.entries(SECTION_COLORS)) {
    if (line.includes(emoji)) return color;
  }
  return null;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isYouTubeUrl(text: string): string | null {
  const match = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\S+/);
  return match ? match[0] : null;
}

function stripSuggestionBlock(content: string): string {
  return content.replace(/\n?💡 \*\*Suggestion:\*\*\s*.+$/s, '').trimEnd();
}

interface HeadingEntry {
  text: string;
  level: number;
  page: number;
  y: number;
  color: [number, number, number] | null;
}

// ── Inline segment rendering (bold + links) ──

interface TextSegment {
  text: string;
  bold: boolean;
  link?: string;
}

function parseInlineSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // First, extract markdown links
  const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...parseBoldSegments(text.slice(lastIndex, match.index)));
    }
    const url = match[2];
    segments.push({
      text: match[1],
      bold: false,
      link: isValidUrl(url) ? url : undefined,
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(...parseBoldSegments(text.slice(lastIndex)));
  }
  return segments;
}

function parseBoldSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index).replace(/\*/g, '');
      if (plain) segments.push({ text: plain, bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex).replace(/\*/g, '');
    if (rest) segments.push({ text: rest, bold: false });
  }
  return segments;
}

function renderInlineSegments(
  doc: jsPDF,
  segments: TextSegment[],
  startX: number,
  y: number,
  fontSize: number,
  maxWidth: number,
  defaultColor: [number, number, number] = [50, 50, 50]
) {
  let x = startX;
  doc.setFontSize(fontSize);

  for (const seg of segments) {
    const cleanText = seg.text.replace(/`(.+?)`/g, '$1');
    doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');

    if (seg.link) {
      doc.setTextColor(59, 130, 246);
      doc.textWithLink(cleanText, x, y, { url: seg.link });
      const w = doc.getTextWidth(cleanText);
      // Draw underline
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.2);
      doc.line(x, y + 0.5, x + w, y + 0.5);
      x += w;
    } else {
      doc.setTextColor(...defaultColor);
      doc.text(cleanText, x, y);
      x += doc.getTextWidth(cleanText);
    }
  }
  // Reset
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...defaultColor);
}

// ── Main export function ──

export function exportResponseToPdf(
  content: string,
  documentName?: string,
  images?: ChatImage[]
) {
  try {
    const cleanContent = stripSuggestionBlock(content);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setProperties({ creator: 'SchoolAI', title: documentName || 'AI Response' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const usableWidth = pageWidth - marginLeft - marginRight;
    const marginBottom = 20;

    let y = 0;
    const headings: HeadingEntry[] = [];

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight - marginBottom) {
        doc.addPage();
        y = 18;
      }
    };

    // ── Header Banner ──
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 3, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('SchoolAI', marginLeft, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      pageWidth - marginRight, 12, { align: 'right' }
    );

    if (documentName) {
      doc.setFontSize(7);
      doc.text(`Source: ${documentName}`, marginLeft, 17);
    }

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 20, pageWidth - marginRight, 20);
    y = 27;

    // ── Process content lines ──
    const lines = cleanContent.split('\n');

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

        doc.setFillColor(r, g, b);
        doc.circle(marginLeft + 1.5, y - 1.2, 1.5, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(r, g, b);
        const text = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
        const wrapped = doc.splitTextToSize(text, usableWidth - 8);
        doc.text(wrapped, marginLeft + 6, y);

        headings.push({ text, level: 2, page: doc.getNumberOfPages(), y, color: sectionColor });

        y += wrapped.length * 5;
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, y + 0.5, marginLeft + 50, y + 0.5);
        y += 4;
        continue;
      }

      // ── Heading detection (markdown) ──
      const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizes = [16, 14, 12];
        const spacings = [7, 6, 5];
        const fontSize = sizes[level - 1];
        const spacing = spacings[level - 1];

        addNewPageIfNeeded(fontSize);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        const text = headingMatch[2].replace(/\*\*/g, '');
        const wrapped = doc.splitTextToSize(text, usableWidth);
        doc.text(wrapped, marginLeft, y);

        headings.push({ text, level, page: doc.getNumberOfPages(), y, color: null });

        y += wrapped.length * spacing + (5 - level);
        continue;
      }

      // ── Horizontal rule ──
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
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(marginLeft, y - 3, 14, 4.5, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VIDEO', marginLeft + 1.5, y);

        const linkText = line.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim();
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);

        if (isValidUrl(youtubeUrl)) {
          doc.textWithLink(linkText || 'Watch on YouTube', marginLeft + 16, y, { url: youtubeUrl });
        } else {
          doc.text(linkText || 'Watch on YouTube', marginLeft + 16, y);
        }
        y += 4.5;

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
        const text = line.replace(/^\s*[-*+]\s+/, '');
        const segments = parseInlineSegments(text);
        const plainText = segments.map(s => s.text).join('');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        const wrapped = doc.splitTextToSize(plainText, usableWidth - (bulletIndent - marginLeft) - 5);
        addNewPageIfNeeded(wrapped.length * 4.5);
        doc.text('•', bulletIndent, y);

        // If segments have links/bold, render inline on first line
        if (segments.some(s => s.link || s.bold)) {
          renderInlineSegments(doc, segments, bulletIndent + 5, y, 10, usableWidth - (bulletIndent - marginLeft) - 5);
          y += wrapped.length * 4.5 + 1.5;
        } else {
          doc.text(wrapped, bulletIndent + 5, y);
          y += wrapped.length * 4.5 + 1.5;
        }
        continue;
      }

      // ── Numbered list ──
      if (line.match(/^\s*\d+\.\s/)) {
        const match = line.match(/^(\s*)(\d+\.)\s+(.*)/);
        if (match) {
          const num = match[2];
          const text = match[3];
          const segments = parseInlineSegments(text);
          const plainText = segments.map(s => s.text).join('');

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
          const wrapped = doc.splitTextToSize(plainText, usableWidth - 10);
          addNewPageIfNeeded(wrapped.length * 4.5);

          doc.setFont('helvetica', 'bold');
          doc.text(num, marginLeft, y);
          doc.setFont('helvetica', 'normal');

          if (segments.some(s => s.link || s.bold)) {
            renderInlineSegments(doc, segments, marginLeft + 10, y, 10, usableWidth - 10);
          } else {
            doc.text(wrapped, marginLeft + 10, y);
          }
          y += wrapped.length * 4.5 + 1.5;
          continue;
        }
      }

      // ── Regular paragraph with inline formatting ──
      const segments = parseInlineSegments(line);
      const hasRichContent = segments.some(s => s.link || s.bold);

      if (hasRichContent) {
        doc.setFontSize(10);
        addNewPageIfNeeded(6);
        renderInlineSegments(doc, segments, marginLeft, y, 10, usableWidth);
        y += 5;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        const cleanText = segments.map(s => s.text).join('').replace(/`(.+?)`/g, '$1');
        const wrapped = doc.splitTextToSize(cleanText, usableWidth);
        addNewPageIfNeeded(wrapped.length * 4.5);
        doc.text(wrapped, marginLeft, y);
        y += wrapped.length * 4.5 + 1;
      }
    }

    // ── Embed AI-generated images ──
    if (images && images.length > 0) {
      for (const img of images) {
        try {
          const url = img.image_url.url;
          if (!url.startsWith('data:image/')) continue;

          addNewPageIfNeeded(80);
          const formatMatch = url.match(/^data:image\/(png|jpeg|jpg|webp)/);
          const format = formatMatch ? formatMatch[1].toUpperCase().replace('JPG', 'JPEG') : 'PNG';

          const maxImgWidth = Math.min(usableWidth, 150);
          const imgHeight = maxImgWidth * 0.75; // Approximate aspect ratio

          doc.addImage(url, format, marginLeft, y, maxImgWidth, imgHeight);
          y += imgHeight + 5;
        } catch {
          // Skip broken images silently
        }
      }
    }

    // ── TOC (insert after header if 3+ headings) ──
    if (headings.length >= 3) {
      // Insert TOC as page 2
      doc.insertPage(2);
      doc.setPage(2);

      let tocY = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('Table of Contents', marginLeft, tocY);
      tocY += 8;

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, tocY - 2, marginLeft + 50, tocY - 2);
      tocY += 4;

      for (const h of headings) {
        const indentX = marginLeft + (h.level - 1) * 6;
        const adjustedPage = h.page + 1; // +1 because we inserted TOC page

        doc.setFontSize(h.level === 1 ? 11 : h.level === 2 ? 10 : 9);
        doc.setFont('helvetica', h.level <= 2 ? 'bold' : 'normal');

        if (h.color) {
          doc.setTextColor(...h.color);
        } else {
          doc.setTextColor(40, 40, 40);
        }

        const truncTitle = h.text.length > 60 ? h.text.slice(0, 57) + '...' : h.text;
        doc.text(truncTitle, indentX, tocY);

        // Page number right-aligned
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(`${adjustedPage}`, pageWidth - marginRight, tocY, { align: 'right' });

        tocY += 6;
        if (tocY > pageHeight - marginBottom) {
          // TOC overflow – stop
          break;
        }
      }
    }

    // ── Footer on each page ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);
      doc.setFontSize(7);
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.text('SchoolAI', marginLeft, pageHeight - 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Generated by SchoolAI', pageWidth - marginRight, pageHeight - 10, { align: 'right' });
    }

    // ── File size check ──
    const pdfBlob = doc.output('blob');
    if (pdfBlob.size > 10 * 1024 * 1024) {
      console.warn('PDF exceeds 10MB:', (pdfBlob.size / 1024 / 1024).toFixed(1), 'MB');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName = documentName
      ? documentName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
      : 'response';
    doc.save(`SchoolAI_${safeName}_${timestamp}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
